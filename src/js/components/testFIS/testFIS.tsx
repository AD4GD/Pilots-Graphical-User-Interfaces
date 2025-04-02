import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select, Slider, Button } from "antd";
import geoblaze from "geoblaze";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { writeArrayBuffer } from "geotiff";

const epsg32631 = "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

const availableTimes = [
  "1987-01-01T00:00:00.000Z",
  "1992-01-01T00:00:00.000Z",
  "1997-01-01T00:00:00.000Z",
  "2002-01-01T00:00:00.000Z",
  "2007-01-01T00:00:00.000Z",
  "2012-01-01T00:00:00.000Z",
  "2017-01-01T00:00:00.000Z",
  "2022-01-01T00:00:00.000Z",
];

const exportCombinedRaster = async (combinedRaster: any) => {
  try {
    const { values, width, height, xmin, ymin, xmax, ymax } = combinedRaster;

    // Properly extract and flatten the raster values
    let flattenedValues;
    if (Array.isArray(values)) {
      // Check if it's a multi-band or single-band array
      if (Array.isArray(values[0])) {
        // It's a multi-band array, take the first band
        if (Array.isArray(values[0][0])) {
          // 3D array [band][row][col]
          flattenedValues = values[0].reduce((acc, row) => acc.concat(row), []);
        } else {
          // 2D array [band][pixel]
          flattenedValues = values[0];
        }
      } else {
        // It's already a 1D array of pixels
        flattenedValues = values;
      }
    }

    // Calculate pixel scale (resolution in both directions)
    const pixelScaleX = (xmax - xmin) / width;
    const pixelScaleY = (ymax - ymin) / height; // Note: typically negative for GeoTIFF

    // Create metadata object following the example format
    const metadata = {
      width,
      height,
      // Standard GeoTIFF keys with UTM zone 31N (EPSG:32631)
      GeographicTypeGeoKey: 32631, // WGS 84 / UTM zone 31N
      ModelPixelScale: [pixelScaleX, Math.abs(pixelScaleY), 0],
      ModelTiepoint: [0, 0, 0, xmin, ymax, 0], // Upper left corner coordinates
    };

    // Convert to appropriate array if needed
    const typedArray =
      flattenedValues instanceof Uint8Array
        ? flattenedValues
        : new Uint8Array(flattenedValues);

    // Create GeoTIFF using writeArrayBuffer with simplified metadata
    const tiff = await writeArrayBuffer(typedArray, metadata);

    // Export as blob and download
    const blob = new Blob([tiff], { type: "image/tiff" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "combined_raster.tiff";
    link.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error exporting combined raster:", error);
    alert(`Failed to export combined raster: ${error.message}`);
    return false;
  }
};

const getResolution = () => {
  const width = window.innerWidth;
  return width < 600 ? 32 : width < 1200 ? 48 : 64;
};

const getDrawingBounds = (polygons: L.Polygon[]): L.LatLngBounds => {
  const bounds = L.latLngBounds([]);
  polygons.forEach((polygon) => bounds.extend(polygon.getBounds()));
  return bounds;
};

const geoToPixel = (georaster: any, easting: number, northing: number) => {
  const { xmin, ymin, xmax, ymax, width, height } = georaster;

  const xResolution = (xmax - xmin) / width;
  const yResolution = (ymax - ymin) / height;

  const col = Math.floor((easting - xmin) / xResolution);
  const row = Math.floor((ymax - northing) / yResolution);

  if (col >= 0 && col < width && row >= 0 && row < height) {
    return { col, row };
  } else {
    console.log("Coordinates are out of bounds.");
    return null;
  }
};

const cropGeorasterToBounds = async (
  georaster: any,
  bounds: L.LatLngBounds
) => {
  // Get the initial bounds from the drawing
  const [minLng, minLat, maxLng, maxLat] = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];

  console.log(minLng, minLat, maxLng, maxLat);

  // Convert WGS84 coordinates to EPSG:32631
  const [minEasting, minNorthing] = proj4(wgs84, epsg32631, [minLng, minLat]);
  const [maxEasting, maxNorthing] = proj4(wgs84, epsg32631, [maxLng, maxLat]);

  // Calculate the width and height of the bounds in the projected space
  const boundsWidth = maxEasting - minEasting;
  const boundsHeight = maxNorthing - minNorthing;

  // Add a buffer around the bounds (1x the bounds size in each direction)
  // This will give us 3x the width and 3x the height
  const expandedMinEasting = minEasting - boundsWidth;
  const expandedMinNorthing = minNorthing - boundsHeight;
  const expandedMaxEasting = maxEasting + boundsWidth;
  const expandedMaxNorthing = maxNorthing + boundsHeight;

  // Convert the expanded coordinates to pixel coordinates
  const minPixel = geoToPixel(
    georaster,
    expandedMinEasting,
    expandedMaxNorthing
  );
  const maxPixel = geoToPixel(
    georaster,
    expandedMaxEasting,
    expandedMinNorthing
  );

  // Ensure we stay within the bounds of the original raster
  let startRow = Math.max(0, minPixel?.row || 0);
  let startCol = Math.max(0, minPixel?.col || 0);
  let endRow = Math.min(
    georaster.height - 1,
    maxPixel?.row || georaster.height - 1
  );
  let endCol = Math.min(
    georaster.width - 1,
    maxPixel?.col || georaster.width - 1
  );

  // Extract the relevant portion of the raster
  const croppedValues = georaster.values[0]
    .slice(startRow, endRow + 1)
    .map((row: number[]) => row.slice(startCol, endCol + 1));

  // Calculate the actual geographic coordinates of the cropped raster
  const actualMinEasting = georaster.xmin + startCol * georaster.pixelWidth;
  const actualMaxNorthing = georaster.ymax - startRow * georaster.pixelHeight;
  const actualMaxEasting = georaster.xmin + (endCol + 1) * georaster.pixelWidth;
  const actualMinNorthing =
    georaster.ymax - (endRow + 1) * georaster.pixelHeight;

  return {
    values: [croppedValues],
    width: endCol - startCol + 1,
    height: endRow - startRow + 1,
    xmin: actualMinEasting,
    ymin: actualMinNorthing,
    xmax: actualMaxEasting,
    ymax: actualMaxNorthing,
    pixelWidth: georaster.pixelWidth,
    pixelHeight: georaster.pixelHeight,
  };
};

const isPointInPolygon = (point: L.LatLng, polygon: L.Polygon): boolean => {
  const polygonLatLngs = polygon.getLatLngs()[0] as L.LatLng[];

  if (!polygonLatLngs || polygonLatLngs.length === 0) {
    return false;
  }

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (
    let i = 0, j = polygonLatLngs.length - 1;
    i < polygonLatLngs.length;
    j = i++
  ) {
    const xi = polygonLatLngs[i].lng;
    const yi = polygonLatLngs[i].lat;
    const xj = polygonLatLngs[j].lng;
    const yj = polygonLatLngs[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

const padRasterPreservePosition = (
  croppedRaster: any,
  originalGeoraster: any
) => {
  const {
    width,
    height,
    values,
    xmin,
    ymin,
    xmax,
    ymax,
    pixelWidth,
    pixelHeight,
  } = croppedRaster;

  // Find the larger dimension
  const maxDimension = Math.max(width, height);

  // Calculate the next multiple of 256
  const paddedSize = Math.ceil(maxDimension / 256) * 256;

  console.log(
    `Expanding raster from ${width}x${height} to ${paddedSize}x${paddedSize} while preserving position`
  );

  // Calculate how many additional pixels needed in each direction to maintain the center
  const widthDiff = paddedSize - width;
  const heightDiff = paddedSize - height;

  // Half of the difference (rounded down) goes on the left/top
  const leftPadding = Math.floor(widthDiff / 2);
  const topPadding = Math.floor(heightDiff / 2);

  // The rest goes on the right/bottom
  const rightPadding = widthDiff - leftPadding;
  const bottomPadding = heightDiff - topPadding;

  // Calculate the expanded bounds in georeferenced coordinates
  const expandedXmin = xmin - leftPadding * pixelWidth;
  const expandedYmax = ymax + topPadding * pixelHeight;
  const expandedXmax = xmax + rightPadding * pixelWidth;
  const expandedYmin = ymin - bottomPadding * pixelHeight;

  // Create a new 2D array with allocated space for padding
  const paddedValues = Array(paddedSize)
    .fill(0)
    .map(() => Array(paddedSize).fill(0));

  // We'll try to fill with original georaster data where possible
  for (let y = 0; y < paddedSize; y++) {
    for (let x = 0; x < paddedSize; x++) {
      // Calculate geographic coordinates for this padded position
      const easting = expandedXmin + x * pixelWidth;
      const northing = expandedYmax - y * pixelHeight;

      // Try to find this position in the original georaster
      const pixelCoords = geoToPixel(originalGeoraster, easting, northing);

      if (
        pixelCoords &&
        pixelCoords.row >= 0 &&
        pixelCoords.row < originalGeoraster.height &&
        pixelCoords.col >= 0 &&
        pixelCoords.col < originalGeoraster.width
      ) {
        // This position exists in the original georaster, use its value
        paddedValues[y][x] =
          originalGeoraster.values[0][pixelCoords.row][pixelCoords.col];
      } else {
        // This position is outside the original georaster, use 0
        paddedValues[y][x] = 0;
      }

      // For positions that were in the cropped raster, always use those values
      // (they should appear exactly at their original position)
      const relX = x - leftPadding;
      const relY = y - topPadding;
      if (relX >= 0 && relX < width && relY >= 0 && relY < height) {
        paddedValues[y][x] = values[0][relY][relX];
      }
    }
  }

  return {
    width: paddedSize,
    height: paddedSize,
    values: [paddedValues],
    xmin: expandedXmin,
    ymin: expandedYmin,
    xmax: expandedXmax,
    ymax: expandedYmax,
    pixelWidth: pixelWidth,
    pixelHeight: pixelHeight,
  };
};

const rasterizeDrawing = (croppedRaster: any, polygons: L.Polygon[]) => {
  const { width, height, xmin, ymin, xmax, ymax, pixelWidth, pixelHeight } =
    croppedRaster;

  // Initialize with value 0 (non-drawn areas)
  const drawingRaster = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );

  // For each pixel, check if it's inside any polygon
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Convert pixel coordinates to geographic coordinates
      const easting = xmin + col * pixelWidth;
      const northing = ymax - row * pixelHeight;

      // Convert to WGS84 (lat/lng)
      const [lng, lat] = proj4(epsg32631, wgs84, [easting, northing]);
      const point = L.latLng(lat, lng);

      // Check if this point is inside any polygon
      for (const polygon of polygons) {
        if (isPointInPolygon(point, polygon)) {
          drawingRaster[row][col] = 2; // Set to 2 for ALL points in the polygons
          break; // No need to check other polygons
        }
      }
    }
  }

  return drawingRaster;
};

const combineLayers = (raster: any, drawingRaster: number[][]) => {
  // Ensure raster.values is properly structured
  if (!raster.values || !raster.values[0]) {
    console.error("Invalid raster structure:", raster);
    throw new Error("Invalid raster structure: missing values array");
  }

  console.log("Combining layers with:", {
    rasterDims: `${raster.values[0].length}x${
      raster.values[0][0]?.length || 0
    }`,
    drawingRasterDims: `${drawingRaster.length}x${
      drawingRaster[0]?.length || 0
    }`,
  });

  // Create a new 2D array for the combined values
  const combinedValues = [];

  for (let y = 0; y < raster.height; y++) {
    const row = [];
    for (let x = 0; x < raster.width; x++) {
      // Get the original value from raster if it exists
      let value = 0; // Default value

      if (
        raster.values[0] &&
        raster.values[0][y] &&
        typeof raster.values[0][y][x] !== "undefined"
      ) {
        value = raster.values[0][y][x];
      }

      // Override with drawing value if it exists
      if (drawingRaster && drawingRaster[y] && drawingRaster[y][x] === 2) {
        value = 2; // Value for drawn areas
      }

      row.push(value);
    }
    combinedValues.push(row);
  }

  // Return a new object with all properties from the input raster, but with updated values
  return {
    ...raster, // This preserves all georeferencing properties (xmin, ymin, etc.)
    values: [combinedValues], // Ensure values is a 3D array: [band][row][col]
  };
};

const interpolateColor = (value: number): string => {
  switch (value) {
    case 0:
      return "rgba(0, 0, 0, 0)"; // NODATA (transparent)
    case 1:
      return "rgb(153, 247, 245)"; // Aquatic
    case 2:
      return "rgb(164, 0, 0)"; // Built area
    case 3:
      return "rgb(255, 255, 140)"; // Herbaceous cropland
    case 4:
      return "rgb(255, 200, 145)"; // Woody cropland
    case 5:
      return "rgb(145, 134, 0)"; // Shrubland and grassland
    case 6:
      return "rgb(0, 132, 0)"; // Forestland
    case 7:
      return "rgb(184, 201, 189)"; // Bare/sparse vegetation
    default:
      return "rgba(0, 0, 0, 0)"; // Default to transparent for unknown values
  }
};

const createRaster = async (georaster: any) => {
  return new GeoRasterLayer({
    georaster: georaster,
    opacity: 0.7,
    //@ts-ignore
    pixelValuesToColorFn: (values: number[]) => {
      const value = values[0];

      if (value === undefined || value === null || isNaN(value)) {
        return null; // Transparent for NODATA
      }

      return interpolateColor(value);
    },
    // resolution: getResolution(),
    resolution: 512,
  });
};

const WMSClient: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(availableTimes[6]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const drawLayer = useRef<L.FeatureGroup | null>(null);
  const [georaster, setGeoraster] = useState<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);

      drawLayer.current = L.featureGroup().addTo(leafletMap.current);
      //@ts-ignore
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawLayer.current,
        },
        draw: {
          polygon: true,
          rectangle: false,
          circle: false,
          marker: false,
          polyline: false,
        },
      });
      leafletMap.current.addControl(drawControl);
      //@ts-ignore
      leafletMap.current.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawLayer.current?.addLayer(layer);
      });
    }
  }, []);

  const updateMap = (rasterLayer: any, georaster: any) => {
    if (leafletMap.current && rasterLayer) {
      // Remove existing raster layers
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof GeoRasterLayer) {
          leafletMap.current?.removeLayer(layer);
        }
      });

      // Add the new raster layer
      rasterLayer.addTo(leafletMap.current);

      // Fit the map to the raster bounds
      const layerBounds = rasterLayer.getBounds();
      leafletMap.current.fitBounds(layerBounds);

      // Add a rectangle to highlight the raster bounds
      L.rectangle(layerBounds, {
        color: "#ff0000",
        fillOpacity: 0,
        weight: 1,
      }).addTo(leafletMap.current);

      // Add click event to inspect pixel values
      leafletMap.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Convert WGS84 (Lat, Lng) to EPSG:32631 (Easting, Northing)
        const [easting, northing] = proj4(wgs84, epsg32631, [lng, lat]);

        const pixelCoords = geoToPixel(georaster, easting, northing);

        // Get value using geoblaze.identify with converted coordinates
        // const values = await geoblaze.identify(georaster, [easting, northing]);

        if (pixelCoords) {
          const { col, row } = pixelCoords;
          const rasterValue = georaster.values[0][row][col];
          console.log(
            `Raster Value at georaster.values[0][${row}][${col}]: ${rasterValue}`
          );
        }
      });
    }
  };

  const fetchImage = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://localhost:3000/mucsc?time=${time}`);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      if (
        blob.type !== "image/tiff" &&
        blob.type !== "application/octet-stream"
      ) {
        throw new Error("Invalid file format received. Expected a GeoTIFF.");
      }

      const georaster = await geoblaze.parse(arrayBuffer);
      setGeoraster(georaster);

      const rasterLayer = await createRaster(georaster);
      // console.log(georaster);
      // console.log(rasterLayer);
      updateMap(rasterLayer, georaster);
    } catch (err) {
      console.error("Error fetching the image:", err);
      setError("Error fetching the image.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImage();
  }, [time]);

  const visualizeBounds = (bounds, label, color = "#ff0000") => {
    if (!leafletMap.current) return;

    // Create a rectangle to show the bounds
    const rectangle = L.rectangle(bounds, {
      color: color,
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(leafletMap.current);

    // Add a label to identify the bounds
    const center = bounds.getCenter();
    const marker = L.marker(center, {
      icon: L.divIcon({
        className: "bounds-label",
        html: `<div style="background: white; padding: 3px; border: 1px solid ${color};">${label}</div>`,
        iconSize: [100, 20],
        iconAnchor: [50, 10],
      }),
    }).addTo(leafletMap.current);

    return { rectangle, marker };
  };

  // Add this function to visualize the raster extents
  const visualizeRasterExtent = (georaster, label, color = "#0000ff") => {
    if (!leafletMap.current || !georaster) return;

    // Convert raster corners to WGS84 coordinates
    const nw = proj4(epsg32631, wgs84, [georaster.xmin, georaster.ymax]);
    const ne = proj4(epsg32631, wgs84, [georaster.xmax, georaster.ymax]);
    const se = proj4(epsg32631, wgs84, [georaster.xmax, georaster.ymin]);
    const sw = proj4(epsg32631, wgs84, [georaster.xmin, georaster.ymin]);

    // Create bounds from the corner coordinates
    const bounds = L.latLngBounds(
      [L.latLng(nw[1], nw[0]), L.latLng(ne[1], ne[0])],
      [L.latLng(sw[1], sw[0]), L.latLng(se[1], se[0])]
    );

    return visualizeBounds(bounds, label, color);
  };

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2>Scenario Test</h2>

      <Slider
        min={0}
        max={availableTimes.length - 1}
        defaultValue={6}
        onChange={(value) => setTime(availableTimes[value])}
        marks={{
          0: "1987",
          1: "1992",
          2: "1997",
          3: "2002",
          4: "2007",
          5: "2012",
          6: "2017",
          7: "2022",
        }}
        step={1}
        style={{ width: 400, marginBottom: 20 }}
      />

      <Button
        onClick={async () => {
          if (drawLayer.current && georaster) {
            // Store all visualization objects to remove later
            const visualizations = [];

            // Clear any previous visualizations
            leafletMap.current?.eachLayer((layer) => {
              if (
                layer._bounds &&
                layer.options &&
                layer.options.color !== "#ff0000"
              ) {
                leafletMap.current?.removeLayer(layer);
              }
              if (
                layer instanceof L.Marker &&
                layer.getIcon().options.className === "bounds-label"
              ) {
                leafletMap.current?.removeLayer(layer);
              }
            });

            const polygons = drawLayer.current
              .getLayers()
              .filter((layer) => layer instanceof L.Polygon) as L.Polygon[];

            if (polygons.length === 0) {
              alert("Please draw a polygon first");
              return;
            }

            // Step 1: Visualize the original raster extent
            visualizations.push(
              visualizeRasterExtent(georaster, "Original Raster", " ")
            );

            // Step 2: Get and visualize the drawing bounds
            const drawingBounds = getDrawingBounds(polygons);
            visualizations.push(
              visualizeBounds(drawingBounds, "Drawing Bounds", "#ff00ff")
            );

            // Log WGS84 bounds
            console.log("Drawing Bounds (WGS84):", {
              west: drawingBounds.getWest(),
              south: drawingBounds.getSouth(),
              east: drawingBounds.getEast(),
              north: drawingBounds.getNorth(),
            });

            // Convert bounds to EPSG:32631 coordinates for logging
            const sw32631 = proj4(wgs84, epsg32631, [
              drawingBounds.getWest(),
              drawingBounds.getSouth(),
            ]);
            const ne32631 = proj4(wgs84, epsg32631, [
              drawingBounds.getEast(),
              drawingBounds.getNorth(),
            ]);
            console.log("Drawing Bounds (EPSG:32631):", {
              xmin: sw32631[0],
              ymin: sw32631[1],
              xmax: ne32631[0],
              ymax: ne32631[1],
            });

            try {
              // Step 3: Crop the raster
              const croppedRaster = await cropGeorasterToBounds(
                georaster,
                drawingBounds
              );

              // Step 4: Visualize the cropped raster extent
              visualizations.push(
                visualizeRasterExtent(
                  croppedRaster,
                  "Cropped Raster",
                  "#00ff00"
                )
              );

              console.log("Cropped Raster Bounds (EPSG:32631):", {
                xmin: croppedRaster.xmin,
                ymin: croppedRaster.ymin,
                xmax: croppedRaster.xmax,
                ymax: croppedRaster.ymax,
                width: croppedRaster.width,
                height: croppedRaster.height,
              });

              // Step 5: Pad the raster and visualize
              const paddedRaster = padRasterPreservePosition(
                croppedRaster,
                georaster
              );

              console.log(paddedRaster);

              // Step 6: Visualize the padded raster extent
              visualizations.push(
                visualizeRasterExtent(paddedRaster, "Padded Raster", "#ff8800")
              );

              console.log("Padded Raster Bounds (EPSG:32631):", {
                xmin: paddedRaster.xmin,
                ymin: paddedRaster.ymin,
                xmax: paddedRaster.xmax,
                ymax: paddedRaster.ymax,
                width: paddedRaster.width,
                height: paddedRaster.height,
              });

              const drawingRaster = rasterizeDrawing(paddedRaster, polygons);
              console.log("Drawing Raster:", drawingRaster);

              if (confirm("Export the padded raster as GeoTIFF?")) {
                const combinedRaster = combineLayers(
                  paddedRaster,
                  drawingRaster
                );
                console.log("Combined Raster:", combinedRaster);
                await exportCombinedRaster(combinedRaster);
                // await exportCombinedRaster(paddedRaster);
              }
            } catch (error) {
              console.error("Error in raster processing:", error);
              alert(`Error in raster processing: ${error.message}`);
            }
          } else {
            alert("Please load a raster and draw a polygon first");
          }
        }}
      >
        Visualize Bounds & Export
      </Button>

      <div
        id="map-container"
        style={{
          position: "relative",
          height: "600px",
          width: "60%",
          margin: "30px auto",
        }}
      >
        {loading && <p>Loading image...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default WMSClient;
