import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Select, Row, ConfigProvider, Spin, message } from "antd";
import geoblaze from "geoblaze";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { writeArrayBuffer } from "geotiff";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import Parse from "parse";
import { useNavigate } from "@opendash/router";

const { Option } = Select;

const epsg32631 = "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

const injectCustomIconCSS = () => {
  const customIconsCSS = `
    /* Custom polygon draw icon */
    .leaflet-draw-draw-polygon {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJMMTggOEwxNSAxNkg1TDIgOEwxMCAyWiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+') !important;
      background-size: 16px 16px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }

    /* Custom edit icon */
    .leaflet-draw-edit-edit {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjA2IDQuMjhMMTUuNzIgNS45NEwxMC45NCAxMC43Mkw5LjI4IDkuMDZMMTQuMDYgNC4yOFoiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTggMTJMOCAxNkw0IDE2TDQgMTJIOFoiIGZpbGw9IiMzMzMiLz4KPC9zdmc+') !important;
      background-size: 16px 16px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }

    /* Custom delete icon */
    .leaflet-draw-edit-remove {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgNUwxNSAxNU01IDE1TDE1IDUiIHN0cm9rZT0iI2ZmMzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==') !important;
      background-size: 16px 16px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }

    /* Custom save icon */
    .leaflet-draw-actions-save {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgM0MzLjg5IDMgMyAzLjg5IDMgNVYxNUMzIDE2LjExIDMuODkgMTcgNSAxN0gxNUMxNi4xMSAxNyAxNyAxNi4xMSAxNyAxNVY3TDE1IDNINVpNMTAgMTVDOC4zNCAxNSA3IDEzLjY2IDcgMTJTOC4zNCAxMCAxMCAxMFMxMyAxMS4zNCAxMyAxMlMxMS42NiAxNSAxMCAxNVpNMTMgN0g1VjVIMTNWN1oiIGZpbGw9IiMzMzMiLz4KPC9zdmc+') !important;
      background-size: 16px 16px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }

    /* Custom cancel icon */
    .leaflet-draw-actions-cancel {
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNEwxNiAxNk00IDE2TDE2IDQiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==') !important;
      background-size: 16px 16px !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }
  `;

  const style = document.createElement("style");
  style.textContent = customIconsCSS;
  document.head.appendChild(style);
};

// Utility function to convert a Blob to base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

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

// API parameter types (1, 3, 4, 5, 6 as requested)
const apiParameterTypes = [
  { value: 1, label: "Aquatic" },
  { value: 3, label: "Herbaceous cropland" },
  { value: 4, label: "Woody cropland" },
  { value: 5, label: "Shrubland and grassland" },
  { value: 6, label: "Forestland" },
];

// All land cover types for individual polygon value assignment (1-7)
const allLandCoverTypes = [
  { value: 1, label: "Aquatic" },
  { value: 2, label: "Built area" },
  { value: 3, label: "Herbaceous cropland" },
  { value: 4, label: "Woody cropland" },
  { value: 5, label: "Shrubland and grassland" },
  { value: 6, label: "Forestland" },
  { value: 7, label: "Bare/sparse vegetation" },
];

const exportCombinedRaster = async (
  combinedRaster: any,
  navigate: Function,
  apiParameterType: number,
  apiMode: "high" | "low"
) => {
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
    }; // Show loading message
    message.loading({ content: "Processing scenario...", key: "bioconn" });

    // Create GeoTIFF and call API
    console.log("Creating GeoTIFF for API submission...");

    // Convert to appropriate array if needed
    const typedArray =
      flattenedValues instanceof Uint8Array
        ? flattenedValues
        : new Uint8Array(flattenedValues);

    try {
      // Create GeoTIFF using writeArrayBuffer with metadata
      const tiff = await writeArrayBuffer(typedArray, metadata);

      // Create downloadable GeoTIFF ArrayBuffer for the compare scenario
      const downloadableGeoTiff = new ArrayBuffer(tiff.byteLength);
      new Uint8Array(downloadableGeoTiff).set(new Uint8Array(tiff));

      // Export as blob for API transmission
      const blob = new Blob([tiff], { type: "image/tiff" });

      // Convert GeoTIFF to base64 for transmission
      const base64Data = await blobToBase64(blob);
      console.log("Making request to BioConn API via Cloud Function...");

      let result;
      let lastError;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`API attempt ${attempt}/${maxRetries}...`);

          // Map apiParameterType to API type string
          const typeMapping: { [key: number]: string } = {
            1: "aquatic", // Aquatic
            3: "herbaceous", // Herbaceous cropland
            4: "woody", // Woody cropland
            5: "shrublands", // Shrubland and grassland
            6: "forest", // Forestland
          };

          const apiType = typeMapping[apiParameterType] || "forest";
          console.log(`[Frontend] Making API call with parameters:`, {
            type: apiType,
            mode: apiMode,
            originalParameterType: apiParameterType,
            fileDataLength: base64Data.length,
          });

          result = await Parse.Cloud.run("processBioconnTiff", {
            type: apiType,
            mode: apiMode,
            fileData: base64Data,
          });

          console.log(`[Frontend] API call successful for type: ${apiType}`);

          console.log("BioConn API Response:", result);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.error(`API attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            const delayMs = 2000 * attempt;
            console.log(`Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      if (!result) {
        throw new Error(
          `API failed after ${maxRetries} attempts. Last error: ${
            lastError instanceof Error ? lastError.message : "Unknown error"
          }`
        );
      }

      // Check if the response was successful
      if (result.status !== "success") {
        throw new Error(`API Error: ${result.message || "Unknown error"}`);
      }

      message.success({ content: "Ready to view scenario!", key: "bioconn" });

      console.log("cai object di tiep vao compare la cai nay:", combinedRaster);

      // Navigate to the compare view with both original raster, API response, and downloadable GeoTIFF
      navigate("/bioconnect/compare", {
        state: {
          originalRaster: {
            ...combinedRaster,
            downloadableGeoTiff: downloadableGeoTiff, // Add the downloadable GeoTIFF ArrayBuffer
          },
          apiResponse: result,
        },
      });

      return true;
    } catch (error) {
      console.error("Error in API processing:", error);

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        if (
          error.message.includes("502") ||
          error.message.includes("Bad Gateway")
        ) {
          errorMessage =
            "BioConn API server is temporarily unavailable (502 Bad Gateway). Please try again later.";
        } else if (
          error.message.includes("503") ||
          error.message.includes("Service Unavailable")
        ) {
          errorMessage =
            "BioConn API service is temporarily unavailable. Please try again later.";
        } else if (
          error.message.includes("timeout") ||
          error.message.includes("TIMEOUT")
        ) {
          errorMessage =
            "API request timed out. The server may be busy, please try again.";
        } else if (error.message.includes("Network")) {
          errorMessage =
            "Network error occurred. Please check your connection and try again.";
        } else if (error.message.includes("failed after")) {
          errorMessage = `API service is currently unavailable. ${error.message}`;
        } else {
          errorMessage = `API Error: ${error.message}`;
        }
      }

      message.error({
        content: errorMessage,
        key: "bioconn",
        duration: 6,
      });
      return false;
    }
  } catch (error: any) {
    console.error("Error exporting combined raster:", error);
    message.error({
      content: `Failed to export raster: ${error.message}`,
      key: "bioconn",
    });
    return false;
  }
};

const getDrawingBounds = (polygons: L.Polygon[]): L.LatLngBounds => {
  console.log(`Getting bounds for ${polygons.length} polygons`);
  const bounds = L.latLngBounds([]);

  polygons.forEach((polygon, index) => {
    const polygonBounds = polygon.getBounds();
    console.log(
      `Polygon ${index + 1} bounds:`,
      `SW(${polygonBounds.getSouthWest().lng.toFixed(5)}, ${polygonBounds
        .getSouthWest()
        .lat.toFixed(5)})`,
      `NE(${polygonBounds.getNorthEast().lng.toFixed(5)}, ${polygonBounds
        .getNorthEast()
        .lat.toFixed(5)})`
    );
    bounds.extend(polygonBounds);
  });

  if (polygons.length > 0) {
    console.log(
      `Combined bounds:`,
      `SW(${bounds.getSouthWest().lng.toFixed(5)}, ${bounds
        .getSouthWest()
        .lat.toFixed(5)})`,
      `NE(${bounds.getNorthEast().lng.toFixed(5)}, ${bounds
        .getNorthEast()
        .lat.toFixed(5)})`
    );
  } else {
    console.warn("No polygons provided to getDrawingBounds");
  }

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

  console.log(
    `Drawing bounds in WGS84: minLng=${minLng.toFixed(
      5
    )}, minLat=${minLat.toFixed(5)}, maxLng=${maxLng.toFixed(
      5
    )}, maxLat=${maxLat.toFixed(5)}`
  );

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
  // Get the polygon coordinates
  // Handle the potential complexity of Leaflet polygon structures
  let polygonLatLngs: L.LatLng[] = [];

  try {
    const latLngs = polygon.getLatLngs();

    // Handle different polygon structures
    if (Array.isArray(latLngs)) {
      if (latLngs.length === 0) return false;

      // Check if it's a multi-polygon or has holes
      if (Array.isArray(latLngs[0])) {
        // It's either a polygon with holes or a multi-polygon
        if (Array.isArray(latLngs[0][0])) {
          // It's a multi-polygon, use the first polygon for simplicity
          polygonLatLngs = latLngs[0][0] as L.LatLng[];
        } else {
          // It's a polygon with holes, use the outer ring
          polygonLatLngs = latLngs[0] as L.LatLng[];
        }
      } else {
        // Simple polygon
        polygonLatLngs = latLngs as L.LatLng[];
      }
    }
  } catch (error) {
    console.error("Error processing polygon coordinates:", error);
    return false;
  }

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

const rasterizeDrawing = (
  croppedRaster: any,
  polygons: L.Polygon[],
  polygonValues: Map<string, number>
) => {
  const { width, height, xmin, ymin, xmax, ymax, pixelWidth, pixelHeight } =
    croppedRaster;

  console.log(
    `Rasterizing ${polygons.length} polygons with dimensions: ${width}x${height}`
  );
  console.log(
    `Raster bounds: xmin=${xmin}, ymin=${ymin}, xmax=${xmax}, ymax=${ymax}`
  );
  console.log(`Pixel dimensions: width=${pixelWidth}, height=${pixelHeight}`);

  // Initialize with value 0 (non-drawn areas)
  const drawingRaster = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );

  // Create an array of polygon data with their values
  const polygonData = polygons.map((polygon: any) => {
    const polygonId = polygon.polygonId;
    const value = polygonValues.get(polygonId) || 1;

    // Get the polygon's coordinates in the correct format
    let coords: L.LatLng[] = [];

    try {
      const latLngs = polygon.getLatLngs();

      // Handle different polygon structures
      if (Array.isArray(latLngs)) {
        if (latLngs.length === 0) return { polygon, value, coords: [] };

        // Check if it's a multi-polygon or has holes
        if (Array.isArray(latLngs[0])) {
          // It's either a polygon with holes or a multi-polygon
          if (Array.isArray(latLngs[0][0])) {
            // It's a multi-polygon, use the first polygon for simplicity
            coords = latLngs[0][0] as L.LatLng[];
          } else {
            // It's a polygon with holes, use the outer ring
            coords = latLngs[0] as L.LatLng[];
          }
        } else {
          // Simple polygon
          coords = latLngs as L.LatLng[];
        }
      }
    } catch (error) {
      console.error(
        `Error processing polygon ${polygonId} coordinates:`,
        error
      );
      return { polygon, value, coords: [] };
    }

    return { polygon, value, polygonId, coords };
  });

  console.log(`Prepared ${polygonData.length} polygons for rasterization`);

  // Process polygons in drawing order - each polygon completely overwrites the area it covers
  for (const { polygon, value, polygonId, coords } of polygonData) {
    if (coords.length === 0) {
      console.warn(`Skipping polygon ${polygonId} with no valid coordinates`);
      continue;
    }

    console.log(
      `Processing polygon ${polygonId} with value ${value} (${coords.length} points)`
    );

    // Calculate polygon bounds to optimize scanning only necessary pixels
    const polygonBounds = polygon.getBounds();
    const [minLng, minLat, maxLng, maxLat] = [
      polygonBounds.getWest(),
      polygonBounds.getSouth(),
      polygonBounds.getEast(),
      polygonBounds.getNorth(),
    ];

    // Convert WGS84 coordinates to EPSG:32631
    const [minEasting, minNorthing] = proj4(wgs84, epsg32631, [minLng, minLat]);
    const [maxEasting, maxNorthing] = proj4(wgs84, epsg32631, [maxLng, maxLat]);

    // Calculate pixel range for this polygon (with a small buffer)
    const buffer = 2; // Buffer of 2 pixels to ensure we don't miss edge cases
    const startCol = Math.max(
      0,
      Math.floor((minEasting - xmin) / pixelWidth) - buffer
    );
    const endCol = Math.min(
      width - 1,
      Math.ceil((maxEasting - xmin) / pixelWidth) + buffer
    );
    const startRow = Math.max(
      0,
      Math.floor((ymax - maxNorthing) / pixelHeight) - buffer
    );
    const endRow = Math.min(
      height - 1,
      Math.ceil((ymax - minNorthing) / pixelHeight) + buffer
    );

    console.log(
      `Scanning pixel range: rows ${startRow}-${endRow}, cols ${startCol}-${endCol}`
    );

    // Track if any pixels were set for this polygon
    let pixelsSet = 0;

    // Only scan pixels within the polygon's bounds
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        // Convert pixel coordinates to geographic coordinates
        const easting = xmin + col * pixelWidth;
        const northing = ymax - row * pixelHeight;

        // Convert to WGS84 (lat/lng)
        const [lng, lat] = proj4(epsg32631, wgs84, [easting, northing]);
        const point = L.latLng(lat, lng);

        // If this pixel is inside the current polygon, set its value
        if (isPointInPolygon(point, polygon)) {
          drawingRaster[row][col] = value;
          pixelsSet++;
        }
      }
    }

    console.log(`Set ${pixelsSet} pixels for polygon ${polygonId}`);

    // Check if any pixels were set
    if (pixelsSet === 0) {
      console.warn(
        `No pixels were set for polygon ${polygonId}. This may indicate an issue with polygon coordinates or rasterization.`
      );
    }
  }

  // Count non-zero pixels
  let nonZeroPixels = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (drawingRaster[row][col] !== 0) {
        nonZeroPixels++;
      }
    }
  }

  console.log(
    `Total non-zero pixels in drawing raster: ${nonZeroPixels} out of ${
      width * height
    }`
  );

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

  // Check for size mismatch
  if (
    raster.height !== drawingRaster.length ||
    raster.width !== drawingRaster[0]?.length
  ) {
    console.warn(
      `Size mismatch between raster (${raster.height}x${raster.width}) and drawing (${drawingRaster.length}x${drawingRaster[0]?.length})`
    );
  }

  // Create a new 2D array for the combined values
  const combinedValues = [];
  let drawnPixelsCount = 0;

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

      // Override with drawing value if it exists and is not 0
      if (
        drawingRaster &&
        y < drawingRaster.length &&
        x < drawingRaster[y]?.length &&
        drawingRaster[y][x] !== 0
      ) {
        value = drawingRaster[y][x]; // Value for drawn areas
        drawnPixelsCount++;
      }

      row.push(value);
    }
    combinedValues.push(row);
  }

  console.log(
    `Combined raster includes ${drawnPixelsCount} pixels from the drawing layer out of ${
      raster.height * raster.width
    } total pixels`
  );

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

const BioConnScenario: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(availableTimes[6]);
  const [apiParameterType, setApiParameterType] = useState(6);
  const [apiMode, setApiMode] = useState<"high" | "low">("high");
  const [processingScenario, setProcessingScenario] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [polygonValues, setPolygonValues] = useState<Map<string, number>>(
    new Map()
  ); // Store value for each polygon
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const polygonValuesRef = useRef<Map<string, number>>(new Map()); // Ref to access current values in event handlers

  // Update ref when state changes
  React.useEffect(() => {
    polygonValuesRef.current = polygonValues;
  }, [polygonValues]); // Function to update all polygon styles based on their current values
  const updateAllPolygonStyles = React.useCallback(() => {
    if (!drawLayer.current) return;

    drawLayer.current.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon && (layer as any).polygonId) {
        const polygonId = (layer as any).polygonId;
        let polygonValue = polygonValues.get(polygonId);

        // If value not found, it might be a newly created polygon, use default
        if (polygonValue === undefined) {
          polygonValue = 1; // Default value
        }

        const baseColor = interpolateColor(polygonValue);
        const isSelected = polygonId === selectedPolygonId;

        if (isSelected) {
          layer.setStyle({
            color: "#ff7800",
            weight: 5,
            opacity: 1,
            fillColor: baseColor,
            fillOpacity: 0.7,
          });
        } else {
          layer.setStyle({
            color: baseColor,
            weight: 3,
            opacity: 0.8,
            fillColor: baseColor,
            fillOpacity: 0.4,
          });
        }
      }
    });
  }, [polygonValues, selectedPolygonId]);
  // Update polygon styles whenever polygonValues or selectedPolygonId changes
  React.useEffect(() => {
    updateAllPolygonStyles();
  }, [polygonValues, selectedPolygonId]);

  // Add keyboard support for polygon selection
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedPolygonId) {
        setSelectedPolygonId(null);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [selectedPolygonId]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const drawLayer = useRef<L.FeatureGroup | null>(null);
  const [georaster, setGeoraster] = useState<any>(null);
  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      // Inject custom CSS for draw control icons
      injectCustomIconCSS();

      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);
      drawLayer.current = L.featureGroup().addTo(leafletMap.current);

      //@ts-ignore
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawLayer.current,
          edit: true,
          remove: true,
        },
        draw: {
          polygon: true,
          rectangle: false,
          circle: false,
          marker: false,
          polyline: false,
          circlemarker: false,
        },
      });
      leafletMap.current.addControl(drawControl); //@ts-ignore
      leafletMap.current.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;

        // Set default value for new polygon using functional state update
        setPolygonValues((prevValues) => {
          // Generate unique ID for the polygon
          const polygonCount = prevValues.size + 1;
          const polygonId = `Polygon_${polygonCount}`;
          layer.polygonId = polygonId;

          const newValues = new Map(prevValues);
          const defaultValue = 1;
          newValues.set(polygonId, defaultValue);
          return newValues;
        });
        // Function to update polygon style based on its value
        const updatePolygonStyle = (
          polygon: any,
          isSelected: boolean = false
        ) => {
          // Get the polygon value with fallback to default
          const polygonValue = 1; // Use default since we just set it
          const baseColor = interpolateColor(polygonValue);

          if (isSelected) {
            polygon.setStyle({
              color: "#ff7800",
              weight: 5,
              opacity: 1,
              fillColor: baseColor,
              fillOpacity: 0.7,
            });
          } else {
            polygon.setStyle({
              color: baseColor,
              weight: 3,
              opacity: 0.8,
              fillColor: baseColor,
              fillOpacity: 0.4,
            });
          }
        };
        // Add click event to select polygon (with overlap handling)
        layer.on("click", (clickEvent: any) => {
          // Stop event propagation to handle overlapping polygons
          L.DomEvent.stopPropagation(clickEvent);

          // Find all polygons at this click point for overlap handling
          const clickLatLng = clickEvent.latlng;
          const overlappingPolygons: any[] = [];

          drawLayer.current?.eachLayer((checkLayer: any) => {
            if (
              checkLayer instanceof L.Polygon &&
              (checkLayer as any).polygonId
            ) {
              // Check if this polygon contains the click point
              const bounds = checkLayer.getBounds();
              if (bounds.contains(clickLatLng)) {
                overlappingPolygons.push(checkLayer);
              }
            }
          });

          // If there are multiple overlapping polygons, cycle through them
          let targetPolygon = layer;
          if (overlappingPolygons.length > 1) {
            const currentIndex = overlappingPolygons.findIndex(
              (p) => (p as any).polygonId === selectedPolygonId
            );
            const nextIndex = (currentIndex + 1) % overlappingPolygons.length;
            targetPolygon = overlappingPolygons[nextIndex];
          } // Reset styles for all polygons - just set the selected ID and let useEffect handle styling
          setSelectedPolygonId((targetPolygon as any).polygonId);
        }); // Add hover effects and tooltips
        layer.on("mouseover", () => {
          // Get current value from ref
          const currentValue =
            polygonValuesRef.current.get(layer.polygonId) || 1;
          const valueLabel =
            allLandCoverTypes.find((type) => type.value === currentValue)
              ?.label || `Value ${currentValue}`;

          layer
            .bindTooltip(
              `ID: ${layer.polygonId}<br/>Value: ${currentValue} - ${valueLabel}`,
              {
                permanent: false,
                direction: "top",
                className: "polygon-tooltip",
              }
            )
            .openTooltip();

          // Add subtle hover effect if not selected (keep original color)
          if (selectedPolygonId !== layer.polygonId) {
            const baseColor = interpolateColor(currentValue);
            const currentStyle = layer.options;
            layer.setStyle({
              color: baseColor, // Keep the original color
              weight: currentStyle.weight + 1,
              opacity: Math.min(currentStyle.opacity + 0.2, 1),
              fillColor: baseColor, // Keep the original fill color
              fillOpacity: currentStyle.fillOpacity,
            });
          }
        });

        layer.on("mouseout", () => {
          layer.closeTooltip();

          // Reset to proper style if not selected
          if (selectedPolygonId !== layer.polygonId) {
            const currentValue =
              polygonValuesRef.current.get(layer.polygonId) || 1;
            const baseColor = interpolateColor(currentValue);
            layer.setStyle({
              color: baseColor,
              weight: 3,
              opacity: 0.8,
              fillColor: baseColor,
              fillOpacity: 0.4,
            });
          }
        });

        // Set initial style
        updatePolygonStyle(layer, false);

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

      // Add click event to inspect pixel values
      leafletMap.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Convert WGS84 (Lat, Lng) to EPSG:32631 (Easting, Northing)
        const [easting, northing] = proj4(wgs84, epsg32631, [lng, lat]);

        const pixelCoords = geoToPixel(georaster, easting, northing);

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
      // Call the Parse Cloud Function for MUCSC
      const result = await Parse.Cloud.run("getMucsc", { time });

      console.log("MUCSC API Response:", result);
      if (result.status !== "success" || !result.data) {
        throw new Error("Failed to fetch image data");
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(result.data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uintArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < binaryString.length; i++) {
        uintArray[i] = binaryString.charCodeAt(i);
      }

      // Parse the GeoTIFF
      const georaster = await geoblaze.parse(arrayBuffer);
      setGeoraster(georaster);

      console.log(georaster);

      const rasterLayer = await createRaster(georaster);
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

  return (
    <>
      <style>
        {`
          .polygon-tooltip {
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            padding: 8px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
          }
          .polygon-tooltip::before {
            border-top-color: rgba(0, 0, 0, 0.8) !important;
          }
        `}
      </style>
      <Row style={{ width: "100%", height: "100px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-bioconn-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      <ConfigProvider
        wave={{ disabled: true }}
        theme={{
          token: {
            colorPrimary: "#96F5D0",
            colorTextLightSolid: "black",
            borderRadius: 6,
            fontSize: 16,
          },
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            maxWidth: "1200px",
            margin: "20px auto",
          }}
        >
          <div
            style={{
              flex: "0 0 30%",
              padding: "20px",
              borderRight: "1px solid #eee",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: "6px",
                border: "1px solid #bae6fd",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#0284c7",
                }}
              >
                📍 How to use:
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#075985",
                  lineHeight: "1.4",
                }}
              >
                1. Use the polygon tool to draw areas on the map
                <br />
                2. Click on drawn polygons to select them
                <br /> 3. Assign values (1-7) to each selected polygon
                <br />
                4. Choose processing mode (High/Low quality)
                <br />
                5. Choose an API parameter type (1,3-6) for processing
                <br />
                6. Press ESC to deselect, or click "Clear selection"
              </div>            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                API Parameter Type
              </label>
              <Select
                style={{ width: "100%" }}
                value={apiParameterType}                onChange={(value) => {
                  console.log(
                    `[Frontend] API Parameter Type changed to: ${value} (${
                      apiParameterTypes.find((t) => t.value === value)?.label
                    })`
                  );
                  setApiParameterType(value);
                  
                  // Automatically switch to low resolution for non-forest types
                  if (value !== 6 && apiMode === "high") {
                    console.log("[Frontend] Switching to low resolution - high resolution only available for Forest");
                    setApiMode("low");
                  }
                }}
              >
                {apiParameterTypes.map(
                  (type: { value: number; label: string }) => (
                    <Option key={type.value} value={type.value}>
                      {type.value} - {type.label}
                    </Option>
                  )
                )}{" "}
              </Select>
              <div
                style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
              >
                Current selection: {apiParameterType} -{" "}
                {
                  apiParameterTypes.find((t) => t.value === apiParameterType)
                    ?.label
                }
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Processing Mode
              </label>              <Select
                style={{ width: "100%" }}
                value={apiMode}
                onChange={(value) => {
                  // Prevent high resolution selection for non-forest types
                  if (value === "high" && apiParameterType !== 6) {
                    console.log("[Frontend] High resolution not available for this type, staying on low resolution");
                    return;
                  }
                  setApiMode(value);
                }}
              >
                <Option value="high" disabled={apiParameterType !== 6}>
                  High Resolution {apiParameterType !== 6 ? "(Forest only)" : ""}
                </Option>
                <Option value="low">Low Resolution (All types)</Option>
              </Select>
              <div
                style={{ 
                  marginTop: "8px", 
                  fontSize: "12px", 
                  color: apiParameterType === 6 ? "#52c41a" : "#ff6b6b" 
                }}
              >
                {apiParameterType === 6 
                  ? "✓ High resolution available for Forestland"
                  : "⚠ High resolution is only available for Forestland (type 6). Other types support low resolution only."
                }
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Polygon Value Assignment
              </label>
              <div
                style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}
              >
                {polygonValues.size > 0
                  ? `${polygonValues.size} polygon(s) drawn. Click a polygon to select it.`
                  : "No polygons drawn yet. Draw polygons on the map first."}
              </div>
              <Select
                style={{ width: "100%" }}
                value={
                  selectedPolygonId
                    ? polygonValues.get(selectedPolygonId)
                    : undefined
                }
                onChange={(value) => {
                  if (selectedPolygonId) {
                    const newValues = new Map(polygonValues);
                    newValues.set(selectedPolygonId, value);
                    setPolygonValues(newValues);
                  }
                }}
                placeholder={
                  polygonValues.size > 0
                    ? "Click a polygon to select it"
                    : "Draw polygons first"
                }
                disabled={!selectedPolygonId}
              >
                {allLandCoverTypes.map(
                  (type: { value: number; label: string }) => (
                    <Option key={type.value} value={type.value}>
                      {type.value} - {type.label}
                    </Option>
                  )
                )}
              </Select>
              {selectedPolygonId && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    Selected: {selectedPolygonId}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Current value: {polygonValues.get(selectedPolygonId)}
                  </div>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setSelectedPolygonId(null)}
                    style={{ padding: "0", fontSize: "11px", height: "auto" }}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </div>{" "}
            {polygonValues.size > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    Drawn Polygons Summary:
                  </div>
                  {Array.from(polygonValues.entries()).map(([id, value]) => {
                    const typeLabel =
                      allLandCoverTypes.find((type) => type.value === value)
                        ?.label || `Value ${value}`;
                    return (
                      <div
                        key={id}
                        style={{
                          fontSize: "12px",
                          marginBottom: "4px",
                          padding: "4px 8px",
                          backgroundColor:
                            selectedPolygonId === id ? "#e6f7ff" : "white",
                          borderRadius: "3px",
                          border:
                            selectedPolygonId === id
                              ? "1px solid #1890ff"
                              : "1px solid #d9d9d9",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          // Find and highlight the polygon
                          drawLayer.current?.eachLayer((layer: any) => {
                            if (
                              layer instanceof L.Polygon &&
                              (layer as any).polygonId === id
                            ) {
                              // Trigger click event to select the polygon
                              layer.fire("click", {
                                latlng: layer.getBounds().getCenter(),
                              });
                            }
                          });
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: interpolateColor(value),
                              marginRight: "8px",
                              border: "1px solid #999",
                              borderRadius: "2px",
                            }}
                          ></div>
                          <span>
                            {id}: {value} - {typeLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  danger
                  type="dashed"
                  size="small"
                  style={{ width: "100%" }}
                  onClick={() => {
                    drawLayer.current?.clearLayers();
                    setPolygonValues(new Map());
                    setSelectedPolygonId(null);
                  }}
                >
                  Clear All Polygons
                </Button>
              </div>
            )}
            <Button
              type="primary"
              style={{ width: "100%", marginTop: "20px" }}
              loading={isSaving}
              onClick={async () => {
                if (drawLayer.current && georaster) {
                  const polygons = drawLayer.current
                    .getLayers()
                    .filter(
                      (layer) => layer instanceof L.Polygon
                    ) as L.Polygon[];

                  if (polygons.length === 0) {
                    alert("Please draw a polygon first");
                    return;
                  }

                  // Check for polygons with missing values
                  const missingValues = polygons.some((polygon: any) => {
                    return !polygonValues.has(polygon.polygonId);
                  });

                  if (missingValues) {
                    // Set default values for any polygons that don't have them
                    const newValues = new Map(polygonValues);
                    polygons.forEach((polygon: any) => {
                      if (!newValues.has(polygon.polygonId)) {
                        newValues.set(polygon.polygonId, 1); // Default value
                        console.log(
                          `Setting default value for polygon ${polygon.polygonId}`
                        );
                      }
                    });
                    setPolygonValues(newValues);
                  }

                  console.log(
                    `Processing ${polygons.length} polygons with values:`,
                    [...polygonValues.entries()].map(
                      ([id, value]) => `${id}: ${value}`
                    )
                  );

                  try {
                    setProcessingScenario(true);
                    setIsSaving(true);

                    // Log polygon bounds
                    polygons.forEach((polygon, idx) => {
                      const bounds = polygon.getBounds();
                      console.log(
                        `Polygon ${idx + 1} bounds:`,
                        `SW(${bounds.getSouthWest().lng.toFixed(5)}, ${bounds
                          .getSouthWest()
                          .lat.toFixed(5)})`,
                        `NE(${bounds.getNorthEast().lng.toFixed(5)}, ${bounds
                          .getNorthEast()
                          .lat.toFixed(5)})`
                      );
                    });

                    const drawingBounds = getDrawingBounds(polygons);
                    console.log(
                      `Combined drawing bounds:`,
                      `SW(${drawingBounds
                        .getSouthWest()
                        .lng.toFixed(5)}, ${drawingBounds
                        .getSouthWest()
                        .lat.toFixed(5)})`,
                      `NE(${drawingBounds
                        .getNorthEast()
                        .lng.toFixed(5)}, ${drawingBounds
                        .getNorthEast()
                        .lat.toFixed(5)})`
                    );

                    // Check for very small bounds which might indicate a problem
                    const boundsSizeInDegrees =
                      (drawingBounds.getNorth() - drawingBounds.getSouth()) *
                      (drawingBounds.getEast() - drawingBounds.getWest());
                    if (boundsSizeInDegrees < 1e-10) {
                      console.warn(
                        "Drawing bounds are extremely small, which may cause issues"
                      );
                      message.warning(
                        "The drawn area is very small, which may affect processing quality"
                      );
                    }

                    const croppedRaster = await cropGeorasterToBounds(
                      georaster,
                      drawingBounds
                    );
                    console.log(
                      `Cropped raster dimensions: ${croppedRaster.width}x${croppedRaster.height}`
                    );

                    // Ensure the cropped raster has some minimum size
                    if (croppedRaster.width < 10 || croppedRaster.height < 10) {
                      console.warn(
                        "Cropped raster is very small, expanding bounds"
                      ); // Expand the bounds slightly
                      const center = drawingBounds.getCenter();
                      const latExtension = Math.max(
                        0.001,
                        (drawingBounds.getNorth() - drawingBounds.getSouth()) *
                          2
                      );
                      const lngExtension = Math.max(
                        0.001,
                        (drawingBounds.getEast() - drawingBounds.getWest()) * 2
                      );

                      const expandedBounds = L.latLngBounds([
                        [center.lat - latExtension, center.lng - lngExtension],
                        [center.lat + latExtension, center.lng + lngExtension],
                      ]);

                      console.log(
                        "Using expanded bounds:",
                        `SW(${expandedBounds
                          .getSouthWest()
                          .lng.toFixed(5)}, ${expandedBounds
                          .getSouthWest()
                          .lat.toFixed(5)})`,
                        `NE(${expandedBounds
                          .getNorthEast()
                          .lng.toFixed(5)}, ${expandedBounds
                          .getNorthEast()
                          .lat.toFixed(5)})`
                      );

                      // Re-crop with expanded bounds
                      const recroppedRaster = await cropGeorasterToBounds(
                        georaster,
                        expandedBounds
                      );
                      console.log(
                        `Re-cropped raster dimensions: ${recroppedRaster.width}x${recroppedRaster.height}`
                      );

                      // Use the expanded raster instead
                      const paddedRaster = padRasterPreservePosition(
                        recroppedRaster,
                        georaster
                      );
                      console.log(
                        `Padded raster dimensions: ${paddedRaster.width}x${paddedRaster.height}`
                      );

                      const drawingRaster = rasterizeDrawing(
                        paddedRaster,
                        polygons,
                        polygonValues
                      );

                      const combinedRaster = combineLayers(
                        paddedRaster,
                        drawingRaster
                      );

                      console.log("Combined Raster:", combinedRaster);

                      const success = await exportCombinedRaster(
                        combinedRaster,
                        navigate,
                        apiParameterType,
                        apiMode
                      );

                      if (!success) {
                        setProcessingScenario(false);
                        setIsSaving(false);
                      }
                    } else {
                      // Normal flow with sufficient raster size
                      const paddedRaster = padRasterPreservePosition(
                        croppedRaster,
                        georaster
                      );
                      console.log(
                        `Padded raster dimensions: ${paddedRaster.width}x${paddedRaster.height}`
                      );

                      const drawingRaster = rasterizeDrawing(
                        paddedRaster,
                        polygons,
                        polygonValues
                      );
                      const combinedRaster = combineLayers(
                        paddedRaster,
                        drawingRaster
                      );

                      console.log("Combined Raster:", combinedRaster);

                      const success = await exportCombinedRaster(
                        combinedRaster,
                        navigate,
                        apiParameterType,
                        apiMode
                      );

                      if (!success) {
                        setProcessingScenario(false);
                        setIsSaving(false);
                      }
                    }
                  } catch (error: any) {
                    console.error("Error in raster processing:", error);
                    message.error(
                      `Error in raster processing: ${error.message}`
                    );
                    setProcessingScenario(false);
                    setIsSaving(false);
                  }
                } else {
                  message.warning(
                    "Please load a raster and draw a polygon first"
                  );
                }
              }}
            >
              Save Scenario
            </Button>
          </div>

          <div style={{ flex: "0 0 70%", padding: "20px" }}>
            {/* Map container */}
            <div
              id="map-container"
              style={{
                position: "relative",
                height: "500px",
                width: "100%",
                margin: "0 auto 30px auto",
              }}
            >
              {loading && <p>Loading image...</p>}
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
            </div>

            {/* Legend */}
            <div>
              <h3>Legend</h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: "10px",
                }}
              >
                {allLandCoverTypes.map(
                  (type: { value: number; label: string }) => (
                    <div
                      key={type.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        margin: "5px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "5px 10px",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          backgroundColor: interpolateColor(type.value),
                          marginRight: "10px",
                          border: "1px solid #999",
                        }}
                      ></div>
                      <span>
                        {type.value} - {type.label}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
};

export default BioConnScenario;
