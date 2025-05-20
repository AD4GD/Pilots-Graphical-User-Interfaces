import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Row,
  Select,
  Slider,
  Input,
  Button,
  Checkbox,
  Radio,
  ConfigProvider,
  Collapse,
  Divider,
} from "antd";
import { PlusOutlined, DownOutlined } from "@ant-design/icons";
import geoblaze from "geoblaze";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import colorRamp from "./colorRamp.json";
import { Spin } from "antd";
import { useNavigate } from "@opendash/router";
import Parse from "parse";
import cataloniaBounds from "./cataloniaBounds.json";

const { Option } = Select;
const { Panel } = Collapse;

const epsg32631 = "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

const CATALONIA_BBOX = cataloniaBounds.objects.municipis.bbox;
const CATALONIA_GEO = cataloniaBounds.objects.municipis.geometries;

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

const propertyOptions = [
  "Aquatic",
  "Forest",
  "HerbaceousCrops",
  "WoodyCrops",
  "Shrublands",
];

const geoToPixel = (georaster, easting, northing) => {
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

const BioConn: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState("Forest");
  const [time, setTime] = useState(availableTimes[6]);
  const [xCoord, setXCoord] = useState<string | null>(null);
  const [yCoord, setYCoord] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [speciesOption, setSpeciesOption] = useState<"all" | "specific">("all");
  const [gbifQuery, setGbifQuery] = useState("");
  const [gbifSuggestions, setGbifSuggestions] = useState([]);
  const [selectedTaxonKey, setSelectedTaxonKey] = useState(null);
  const [occurrenceData, setOccurrenceData] = useState([]);
  const [hasLoadedAnyLayer, setHasLoadedAnyLayer] = useState(false);

  const searchGbifSpecies = async (query) => {
    try {
      const response = await fetch(
        `https://api.gbif.org/v1/species/suggest?q=${query}&limit=5`
      );
      const data = await response.json();
      setGbifSuggestions(data);
    } catch (error) {
      console.error("GBIF species search error:", error);
    }
  };

  const fetchGbifOccurrences = async () => {
    if (!selectedTaxonKey) return;

    setLoading(true);
    try {
      // Convert polygon to WKT format
      const wkt = `POLYGON((
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[1]},
        ${CATALONIA_BBOX[2]} ${CATALONIA_BBOX[1]},
        ${CATALONIA_BBOX[2]} ${CATALONIA_BBOX[3]},
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[3]},
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[1]}
      ))`;

      const response = await fetch(
        `https://api.gbif.org/v1/occurrence/search?` +
          `taxonKey=${selectedTaxonKey}&` +
          `geometry=${wkt}&` +
          `limit=300`
      );

      const data = await response.json();
      setOccurrenceData(data.results);
      plotOccurrences(data.results);

      // Zoom to Catalonia bounds
      leafletMap.current.fitBounds([
        [CATALONIA_BBOX[1], CATALONIA_BBOX[0]], // SW
        [CATALONIA_BBOX[3], CATALONIA_BBOX[2]], // NE
      ]);
    } catch (error) {
      console.error("GBIF occurrence fetch error:", error);
      setError("Failed to load species data");
    } finally {
      setLoading(false);
    }
  };

  const plotOccurrences = (occurrences) => {
    // Clear previous occurrences
    leafletMap.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        leafletMap.current.removeLayer(layer);
      }
    });

    // Add new occurrences
    occurrences.forEach((occ) => {
      if (occ.decimalLatitude && occ.decimalLongitude) {
        L.circleMarker([occ.decimalLatitude, occ.decimalLongitude], {
          radius: 5,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(leafletMap.current);
      }
    });
  };

  useEffect(() => {
    if (!leafletMap.current) return;

    const cataloniaLayer = L.geoJSON(
      cataloniaBounds.objects.municipis.geometries,
      {
        style: {
          color: "#3388ff",
          weight: 2,
          fillOpacity: 0.1,
        },
      }
    ).addTo(leafletMap.current);

    return () => {
      cataloniaLayer.remove();
    };
  }, []);

  // WMS layer references
  const roadsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const baseMapLayerRef = useRef<L.TileLayer | null>(null);
  const protectedAreaLayersRef = useRef<{
    natura2000: L.TileLayer.WMS | null;
    enpe: L.TileLayer.WMS | null;
    pein: L.TileLayer.WMS | null;
    aquatic: L.TileLayer.WMS | null;
  }>({
    natura2000: null,
    enpe: null,
    pein: null,
    aquatic: null,
  });

  // State for layers radio button
  const [layerOption, setLayerOption] = useState<"connectivity" | "muscsc">(
    "connectivity"
  );

  // State for checkboxes
  const [checkboxOptions, setCheckboxOptions] = useState({
    satellite: false,
    roads: false,
    rivers: false,
    waterBodies: false,
    protectedAreas: false,
    natura2000: false,
    enpe: false,
    pein: false,
    aquaticProtected: false,
  });

  // Handle species radio button change
  const handleSpeciesChange = (e: any) => {
    setSpeciesOption(e.target.value);
    setShowingAllSpecies(e.target.value === "all");

    // Clear specific species data when switching to all
    if (e.target.value === "all") {
      setSelectedTaxonKey(null);
      setGbifQuery("");
      setGbifSuggestions([]);
      fetchAllSpeciesOccurrences();
    }
  };

  // Handle layers radio button change
  const handleLayerChange = (e: any) => {
    setLayerOption(e.target.value);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (option: string) => {
    const newValue = !checkboxOptions[option];

    setCheckboxOptions((prev) => ({
      ...prev,
      [option]: newValue,
    }));

    // Handle specific layers
    switch (option) {
      case "roads":
        newValue ? addRoadsLayer() : removeRoadsLayer();
        break;
      case "satellite":
        newValue ? addSatelliteLayer() : removeSatelliteLayer();
        break;
      case "natura2000":
        newValue ? addNatura2000Layer() : removeNatura2000Layer();
        break;
      case "enpe":
        newValue ? addENPELayer() : removeENPELayer();
        break;
      case "pein":
        newValue ? addPEINLayer() : removePEINLayer();
        break;
      case "aquaticProtected":
        newValue ? addAquaticProtectedLayer() : removeAquaticProtectedLayer();
        break;
    }
  };

  // Add roads layer to the map
  const addRoadsLayer = async () => {
    if (!leafletMap.current) return;

    try {
      // If we already have a roads layer, remove it first
      if (roadsLayerRef.current) {
        leafletMap.current.removeLayer(roadsLayerRef.current);
        roadsLayerRef.current = null;
      }

      // Create a Leaflet WMS layer directly
      roadsLayerRef.current = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/XARXES_TRANSPORT/wms",
        {
          layers: "XT_GRAF_CATALEG_CARRETERES",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "Graf_Carreteres_Titular",
          opacity: 0.7,
        }
      );

      roadsLayerRef.current.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding roads layer:", err);
      setError("Failed to load roads layer");
    }
  };

  // Remove roads layer from the map
  const removeRoadsLayer = () => {
    if (!leafletMap.current || !roadsLayerRef.current) return;

    leafletMap.current.removeLayer(roadsLayerRef.current);
    roadsLayerRef.current = null;
  };

  // Add satellite layer to the map
  const addSatelliteLayer = async () => {
    if (!leafletMap.current) return;

    try {
      // If we already have a satellite layer, remove it first
      if (satelliteLayerRef.current) {
        leafletMap.current.removeLayer(satelliteLayerRef.current);
        satelliteLayerRef.current = null;
      }

      // Create a Leaflet WMS layer for satellite imagery
      satelliteLayerRef.current = L.tileLayer.wms(
        "https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms",
        {
          layers: "ortofoto_color_vigent",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          opacity: 1.0,
        }
      );

      satelliteLayerRef.current.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding satellite layer:", err);
      setError("Failed to load satellite imagery");
    }
  };

  // Remove satellite layer from the map
  const removeSatelliteLayer = () => {
    if (!leafletMap.current || !satelliteLayerRef.current) return;

    leafletMap.current.removeLayer(satelliteLayerRef.current);
    satelliteLayerRef.current = null;
  };

  // Add Natura 2000 layer
  const addNatura2000Layer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.natura2000) {
        leafletMap.current.removeLayer(
          protectedAreaLayersRef.current.natura2000
        );
        protectedAreaLayersRef.current.natura2000 = null;
      }

      protectedAreaLayersRef.current.natura2000 = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_XARNAT_2000",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_XARNAT2000",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.natura2000.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding Natura 2000 layer:", err);
      setError("Failed to load Natura 2000 layer");
    }
  };

  // Remove Natura 2000 layer
  const removeNatura2000Layer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.natura2000)
      return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.natura2000);
    protectedAreaLayersRef.current.natura2000 = null;
  };

  // Add ENPE layer
  const addENPELayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.enpe) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.enpe);
        protectedAreaLayersRef.current.enpe = null;
      }

      protectedAreaLayersRef.current.enpe = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_ENPE",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ENPE",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.enpe.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding ENPE layer:", err);
      setError("Failed to load ENPE layer");
    }
  };

  // Remove ENPE layer
  const removeENPELayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.enpe) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.enpe);
    protectedAreaLayersRef.current.enpe = null;
  };

  // Add PEIN layer
  const addPEINLayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.pein) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.pein);
        protectedAreaLayersRef.current.pein = null;
      }

      protectedAreaLayersRef.current.pein = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_PEIN",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_PEIN",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.pein.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding PEIN layer:", err);
      setError("Failed to load PEIN layer");
    }
  };

  // Remove PEIN layer
  const removePEINLayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.pein) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.pein);
    protectedAreaLayersRef.current.pein = null;
  };

  // Add Aquatic Protected Areas layer
  const addAquaticProtectedLayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.aquatic) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.aquatic);
        protectedAreaLayersRef.current.aquatic = null;
      }

      protectedAreaLayersRef.current.aquatic = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_ZONHUMIDES",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_ZONES_HUMIDES",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.aquatic.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding Aquatic Protected Areas layer:", err);
      setError("Failed to load Aquatic Protected Areas layer");
    }
  };

  // Remove Aquatic Protected Areas layer
  const removeAquaticProtectedLayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.aquatic) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.aquatic);
    protectedAreaLayersRef.current.aquatic = null;
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);

      // Store reference to the base map layer
      baseMapLayerRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
        }
      );
      baseMapLayerRef.current.addTo(leafletMap.current);
    }
  }, []);

  const updateMap = (rasterLayer: any, georaster: any) => {
    if (leafletMap.current && rasterLayer) {
      // Store current view state
      const currentCenter = leafletMap.current.getCenter();
      const currentZoom = leafletMap.current.getZoom();

      // Remove only GeoRasterLayers, keep other layers intact
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof GeoRasterLayer) {
          leafletMap.current?.removeLayer(layer);
        }
      });

      rasterLayer.addTo(leafletMap.current);

      rasterLayer.on("load", () => {
        setLoading(false); // Set loading to false only after layer is loaded
      });

      // Only fit bounds on first load
      if (!hasLoadedAnyLayer) {
        const layerBounds = rasterLayer.getBounds();
        leafletMap.current.fitBounds(layerBounds);
        setHasLoadedAnyLayer(true); // Mark that we've loaded at least one layer
      } else {
        // For subsequent loads, maintain the previous center and zoom
        leafletMap.current.setView(currentCenter, currentZoom, {
          animate: false,
        });
      }

      // Make sure our raster layer is above the satellite but below the roads
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.bringToBack();
      }

      if (roadsLayerRef.current) {
        roadsLayerRef.current.bringToFront();
      }

      leafletMap.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        // Convert WGS84 (Lat, Lng) to EPSG:32631 (Easting, Northing)
        const [easting, northing] = proj4(wgs84, epsg32631, [lng, lat]);
        const pixelCoords = geoToPixel(georaster, easting, northing);
        // Get value using geoblaze.identify with converted coordinates
        const values = await geoblaze.identify(georaster, [easting, northing]);

        // Create popup content with all information
        let popupContent = `<div style="font-family: Arial, sans-serif">
    <p><strong>WGS84:</strong> Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(
          6
        )}</p>
    <p><strong>EPSG:32631:</strong> Easting: ${easting.toFixed(
      2
    )}, Northing: ${northing.toFixed(2)}</p>
    <p><strong>Value:</strong> ${values !== null ? values : "No data"}</p>`;

        // Add pixel information if available
        //     if (pixelCoords) {
        //       const { col, row } = pixelCoords;
        //       const rasterValue = georaster.values[0][row][col];
        //       popupContent += `<p><strong>Pixel Coordinates:</strong> Row: ${row}, Col: ${col}</p>
        // <p><strong>Raster Value:</strong> ${
        //   rasterValue !== null ? rasterValue : "No data"
        // }</p>`;
        //     }

        popupContent += "</div>";

        // Create and open a popup at the clicked location
        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(leafletMap.current);
      });
    }
  };

  const fetchImage = async () => {
    setLoading(true);
    setError("");
    try {
      // Call the appropriate Parse Cloud Function
      const result = await Parse.Cloud.run(
        layerOption === "connectivity" ? "getConnectivity" : "getMucsc",
        layerOption === "connectivity" ? { time, properties } : { time }
      );
      console.log(time);

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
      const rasterLayer = await createRaster(georaster, layerOption);

      updateMap(rasterLayer, georaster);
    } catch (err) {
      console.error("Error fetching the image:", err);
      setError("Error fetching the image.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle coordinate input and move the map
  const handleGoToCoordinates = () => {
    if (!xCoord || !yCoord || !leafletMap.current) return;

    const easting = parseFloat(xCoord);
    const northing = parseFloat(yCoord);

    if (isNaN(easting)) return;
    if (isNaN(northing)) return;

    try {
      // Convert UTM to WGS84
      const [lng, lat] = proj4(epsg32631, wgs84, [easting, northing]);

      // Check if coordinates are valid
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Invalid coordinates");
      }

      leafletMap.current.setView([lat, lng], 15);
    } catch (error) {
      console.error("Error converting coordinates:", error);
      setError("Invalid coordinates entered");
    }
  };

  useEffect(() => {
    fetchImage();
  }, [properties, time, layerOption]);

  // Effect to manage layers when relevant state changes
  useEffect(() => {
    if (checkboxOptions.roads) {
      addRoadsLayer();
    } else {
      removeRoadsLayer();
    }

    if (checkboxOptions.satellite) {
      addSatelliteLayer();
    } else {
      removeSatelliteLayer();
    }

    if (checkboxOptions.natura2000) {
      addNatura2000Layer();
    } else {
      removeNatura2000Layer();
    }

    if (checkboxOptions.enpe) {
      addENPELayer();
    } else {
      removeENPELayer();
    }

    if (checkboxOptions.pein) {
      addPEINLayer();
    } else {
      removePEINLayer();
    }

    if (checkboxOptions.aquaticProtected) {
      addAquaticProtectedLayer();
    } else {
      removeAquaticProtectedLayer();
    }
  }, [
    checkboxOptions.roads,
    checkboxOptions.satellite,
    checkboxOptions.natura2000,
    checkboxOptions.enpe,
    checkboxOptions.pein,
    checkboxOptions.aquaticProtected,
  ]);

  const interpolateColor = (
    value: number,
    layerOption: "connectivity" | "muscsc"
  ): string => {
    if (layerOption === "muscsc") {
      // MUSCSC color mapping
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
    } else {
      // Connectivity color mapping using colorRamp.json
      if (value < 0) return "rgba(0, 0, 255, 0)"; // Transparent for negative values

      // Normalize the value to a range of 0-255
      const normalizedValue = Math.floor((value / 2.5) * 255);

      // Clamp the value to ensure it stays within 0-255
      const clampedValue = Math.min(Math.max(normalizedValue, 0), 255);

      // Get the corresponding color from the colorRamp.json
      const color = colorRamp[clampedValue.toString()];

      // Return the color in RGB format
      return color || "rgba(0, 0, 0, 0)"; // Default to transparent if color is not found
    }
  };

  const createRaster = async (
    georaster: any,
    layerOption: "connectivity" | "muscsc"
  ) => {
    return new GeoRasterLayer({
      georaster: georaster,
      opacity: 0.7,
      //@ts-ignore
      pixelValuesToColorFn: (values: number[]) => {
        const value = values[0];

        if (value === undefined || value === null || isNaN(value)) {
          return null; // Transparent for NODATA
        }

        return interpolateColor(value, layerOption);
      },
      resolution: 512,
    });
  };

  return (
    <>
      <Row style={{ width: "100%", height: "100px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-bioconn-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      {/* Content Row */}
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
        <Row style={{ width: "100%", display: "flex" }}>
          <div style={{ width: "30%", padding: "16px" }}>
            {/* Map Settings Heading */}
            <h2>Connectivity Calculation</h2>

            {/* Layers Section */}
            <div style={{ marginBottom: "24px" }}>
              <Radio.Group onChange={handleLayerChange} value={layerOption}>
                <Radio
                  value="muscsc"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Catalan Land Use Land Cover (MUCSC)
                </Radio>
                <Radio
                  value="connectivity"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Connectivity Index
                </Radio>
              </Radio.Group>

              <Select
                defaultValue={properties}
                style={{ width: "100%" }}
                onChange={setProperties}
                disabled={layerOption !== "connectivity"}
              >
                {propertyOptions.map((property) => (
                  <Option key={property} value={property}>
                    {property}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Species Section */}
            <div style={{ marginBottom: "24px" }}>
              <h2>Layers</h2>
              <Radio.Group onChange={handleSpeciesChange} value={speciesOption}>
                <Radio
                  value="all"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Show aggregated connectivity for all species
                </Radio>
                <Radio
                  value="specific"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Show specific species from GBIF
                </Radio>
              </Radio.Group>

              {speciesOption === "specific" && (
                <>
                  <Input.Search
                    placeholder="Search GBIF species..."
                    value={gbifQuery}
                    onChange={(e) => {
                      setGbifQuery(e.target.value);
                      searchGbifSpecies(e.target.value);
                    }}
                    onSearch={searchGbifSpecies}
                    style={{ marginTop: 8 }}
                  />

                  {gbifSuggestions.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {gbifSuggestions.map((species) => (
                        <div
                          key={species.key}
                          style={{
                            padding: 8,
                            cursor: "pointer",
                            borderBottom: "1px solid #f0f0f0",
                            ":hover": { backgroundColor: "#f5f5f5" },
                          }}
                          onClick={() => {
                            setSelectedTaxonKey(species.key);
                            setGbifQuery(species.scientificName);
                            setGbifSuggestions([]);
                          }}
                        >
                          {species.scientificName}
                          {species.commonName && ` (${species.commonName})`}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTaxonKey && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 4 }}>
                        Selected: <strong>{gbifQuery}</strong>
                      </div>
                      <Button
                        type="primary"
                        onClick={fetchGbifOccurrences}
                        loading={loading}
                      >
                        Load Occurrences
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <Divider></Divider>

            {/* Checkboxes Section */}
            <div style={{ marginBottom: "24px" }}>
              <Checkbox
                checked={checkboxOptions.satellite}
                onChange={() => handleCheckboxChange("satellite")}
              >
                Satellite image
              </Checkbox>
              <br />
              <Checkbox
                checked={checkboxOptions.roads}
                onChange={() => handleCheckboxChange("roads")}
              >
                Roads and Railways
              </Checkbox>
              <br />
              <Checkbox
                checked={checkboxOptions.rivers}
                onChange={() => handleCheckboxChange("rivers")}
              >
                Rivers
              </Checkbox>
              <br />
              <Checkbox
                checked={checkboxOptions.waterBodies}
                onChange={() => handleCheckboxChange("waterBodies")}
              >
                Water bodies
              </Checkbox>
              <br />
              <Checkbox
                checked={checkboxOptions.waterBodies}
                onChange={() => handleCheckboxChange("waterBodies")}
              >
                Cadastral Information
              </Checkbox>
              <br />

              {/* Protected Areas Collapse */}
              <Collapse
                bordered={false}
                expandIcon={({ isActive }) => (
                  <DownOutlined rotate={isActive ? 180 : 0} />
                )}
                style={{ background: "transparent" }}
              >
                <Panel
                  header="Protected Areas"
                  key="1"
                  style={{ padding: 0 }}
                  // extra={
                  //   <Checkbox
                  //     checked={checkboxOptions.protectedAreas}
                  //     onChange={(e) => {
                  //       e.stopPropagation();
                  //       handleCheckboxChange("protectedAreas");
                  //     }}
                  //   />
                  // }
                >
                  <div style={{ marginLeft: "24px" }}>
                    <Checkbox
                      checked={checkboxOptions.natura2000}
                      onChange={() => handleCheckboxChange("natura2000")}
                    >
                      Natura 2000
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.enpe}
                      onChange={() => handleCheckboxChange("enpe")}
                    >
                      ENPE
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.pein}
                      onChange={() => handleCheckboxChange("pein")}
                    >
                      PEIN
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.aquaticProtected}
                      onChange={() => handleCheckboxChange("aquaticProtected")}
                    >
                      Aquatic Protected Areas
                    </Checkbox>
                  </div>
                </Panel>
              </Collapse>
            </div>

            {/* Buttons Section */}
            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                }}
                onClick={() => navigate("/bioconnect/scenario")}
              >
                Create Scenario
              </Button>
              <Button style={{ width: "100%" }}>Export Data</Button>
            </div>
          </div>

          {/* Right Column (70% width) */}
          <div style={{ width: "70%", padding: "16px" }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                alignItems: "center",
              }}
            >
              <Input
                placeholder="Easting (X)"
                value={xCoord}
                onChange={(e) => setXCoord(e.target.value)}
                style={{ width: "120px" }}
              />
              <Input
                placeholder="Northing (Y)"
                value={yCoord}
                onChange={(e) => setYCoord(e.target.value)}
                style={{ width: "120px" }}
              />
              <Button
                type="primary"
                onClick={handleGoToCoordinates}
                style={{ width: "100px" }}
              >
                Go to
              </Button>
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "65%", // Centered on the map area (70% width column)
                    transform: "translate(-50%, -50%)",
                    zIndex: 1000,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    padding: "20px",
                    borderRadius: "8px",
                  }}
                >
                  <Spin size="large" />
                </div>
              )}
              {error && <p style={{ color: "red" }}>{error}</p>}
            </div>

            <div
              id="map-container"
              style={{
                position: "relative",
                height: "550px",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
            </div>

            {/* Slider under the map */}
            <div style={{ display: "flex", justifyContent: "center" }}>
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
                style={{ width: "90%" }}
              />
            </div>
          </div>
        </Row>
      </ConfigProvider>
    </>
  );
};

export default BioConn;
