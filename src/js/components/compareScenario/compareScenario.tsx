import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geoblaze from "geoblaze";
import {
  Row,
  ConfigProvider,
  Alert,
  Spin,
  Checkbox,
  Input,
  Button,
  Radio,
  Divider,
  Select,
  Collapse,
} from "antd";
import { DownOutlined, InfoCircleOutlined } from "@ant-design/icons";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useLocation, useNavigate } from "@opendash/router";
import * as GeoTIFF from "geotiff";
import Parse from "parse";
import colorRamp from "./colorRamp.json";
import cataloniaBounds from "../bioConn/cataloniaBounds.json";
import {
  base64ToArrayBuffer,
  type GeoTiffAnalysis,
} from "../bioConn/geoTiffAnalysis";

const { Option } = Select;
const { Panel } = Collapse;

// Constants from bioConn.tsx
const CATALONIA_BBOX = cataloniaBounds.objects.municipis.bbox;
const CATALONIA_GEO = cataloniaBounds.objects.municipis.geometries;

// Type definitions for species occurrences
interface GbifSpecies {
  key: number;
  scientificName: string;
  commonName?: string;
}

interface GbifOccurrence {
  decimalLatitude?: number;
  decimalLongitude?: number;
  key: number;
  scientificName?: string;
  vernacularName?: string;
  eventDate?: string;
  recordedBy?: string;
  institutionCode?: string;
  collectionCode?: string;
  catalogNumber?: string;
  basisOfRecord?: string;
  occurrenceStatus?: string;
  country?: string;
  stateProvince?: string;
  locality?: string;
}

// Utility function to download an ArrayBuffer as a file
const downloadArrayBufferAsFile = (
  arrayBuffer: ArrayBuffer,
  filename: string,
  contentType: string = "image/tiff"
) => {
  const blob = new Blob([arrayBuffer], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Function to create a simple GeoTIFF-like ArrayBuffer from raster data
const createGeoTiffFromRasterData = async (
  rasterData: any
): Promise<ArrayBuffer> => {
  try {
    const geoTiffData = {
      type: "GeoTIFF",
      width: rasterData.width,
      height: rasterData.height,
      bounds: {
        xmin: rasterData.xmin,
        ymin: rasterData.ymin,
        xmax: rasterData.xmax,
        ymax: rasterData.ymax,
      },
      values: rasterData.values,
      metadata: {
        created: new Date().toISOString(),
        source: "AD4GD Compare Scenario",
      },
    };

    const jsonString = JSON.stringify(geoTiffData, null, 2);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString).buffer;
  } catch (error) {
    console.error("Failed to create GeoTIFF from raster data:", error);
    throw error;
  }
};

interface CompareScenarioProps {}

interface CheckboxOptions {
  satellite: boolean;
  roads: boolean;
  protectedAreas: boolean;
  natura2000: boolean;
  enpe: boolean;
  pein: boolean;
  aquaticProtected: boolean;
  riversWaterBodies: boolean;
  cadastral: boolean;
}

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

// Helper function to convert custom raster to geoblaze-compatible raster
const convertToGeoblazeRaster = async (customRaster: any) => {
  // If the raster already has geoblaze properties (like _url), it's already parsed
  if (
    customRaster._url ||
    customRaster.georasterPromise ||
    customRaster.metadata?.width
  ) {
    return customRaster;
  }

  try {
    // Validate required properties
    const requiredProps = [
      "values",
      "width",
      "height",
      "xmin",
      "ymin",
      "xmax",
      "ymax",
    ];
    for (const prop of requiredProps) {
      if (customRaster[prop] === undefined) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }

    // Extract values and ensure proper structure
    let values;

    // Handle different array structures
    if (Array.isArray(customRaster.values)) {
      // Check if values is already a 3D array [band][row][col]
      if (
        Array.isArray(customRaster.values[0]) &&
        Array.isArray(customRaster.values[0][0])
      ) {
        values = customRaster.values;
      }
      // Check if values is a 2D array [row][col]
      else if (Array.isArray(customRaster.values[0])) {
        values = [customRaster.values]; // Wrap in array to make it 3D [band][row][col]
      }
      // Otherwise, assume it's a 1D array that needs reshaping
      else {
        // Reshape 1D array to 2D
        const reshapedValues = [];
        for (let y = 0; y < customRaster.height; y++) {
          const row = [];
          for (let x = 0; x < customRaster.width; x++) {
            const index = y * customRaster.width + x;
            row.push(customRaster.values[index] || 0);
          }
          reshapedValues.push(row);
        }
        values = [reshapedValues]; // Wrap in array to make it 3D [band][row][col]
      }
    } else {
      throw new Error("Values must be an array");
    }

    // Calculate pixel scale
    const pixelWidth =
      (customRaster.xmax - customRaster.xmin) / customRaster.width;
    const pixelHeight =
      (customRaster.ymax - customRaster.ymin) / customRaster.height;

    // Create georaster object directly
    const georaster = {
      values: values,
      width: customRaster.width,
      height: customRaster.height,
      xmin: customRaster.xmin,
      ymin: customRaster.ymin,
      xmax: customRaster.xmax,
      ymax: customRaster.ymax,
      pixelWidth: pixelWidth,
      pixelHeight: pixelHeight,
      projection: 32631, // EPSG:32631 (UTM Zone 31N)
      noDataValue: null,
    };

    return georaster;
  } catch (error: any) {
    throw new Error(`Failed to convert raster: ${error.message}`);
  }
};

const createRaster = async (rasterData: any, opacity: number = 0.7) => {
  try {
    let georaster;

    // Check if this is already a parsed georaster or if we need to convert it
    if (
      rasterData._url ||
      rasterData.georasterPromise ||
      rasterData.metadata?.width
    ) {
      georaster = rasterData;
    } else {
      georaster = await convertToGeoblazeRaster(rasterData);
    }

    const geoRasterLayer = new GeoRasterLayer({
      georaster: georaster,
      opacity: opacity,
      //@ts-ignore
      pixelValuesToColorFn: (values: number[]) => {
        const value = values[0];

        // Handle undefined, null, or NaN values
        if (value === undefined || value === null || isNaN(value)) {
          return null; // Transparent for NODATA
        }

        // Handle nodata value or out-of-range values
        if (value < 0 || value > 7) {
          return null; // Transparent
        }

        // Round the value to ensure we get a proper color
        return interpolateColor(Math.round(value));
      },
      resolution: 512,
    });
    return geoRasterLayer;
  } catch (error: any) {
    throw new Error(`Failed to create raster layer: ${error.message}`);
  }
};

// Function to fetch connectivity index (using 2022 data as requested)
const fetchConnectivityIndex = async () => {
  try {
    // Call the Parse Cloud Function for connectivity with 2022 data
    const result = await Parse.Cloud.run("getConnectivity", {
      time: "2022-01-01T00:00:00.000Z", // Use 2022 as requested
      properties: "Forest", // Default to Forest
    });

    if (result.status !== "success" || !result.data) {
      throw new Error("Failed to fetch connectivity data");
    }

    console.log("Connectivity index result:", result);

    // Convert base64 to ArrayBuffer
    const binaryString = atob(result.data);
    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryString.length; i++) {
      uintArray[i] = binaryString.charCodeAt(i);
    }

    // Parse the GeoTIFF
    const georaster = await geoblaze.parse(arrayBuffer);
    return georaster;
  } catch (error: any) {
    throw new Error(`Failed to fetch connectivity index: ${error.message}`);
  }
};

// Function to create connectivity raster layer (with proper color ramp from bioConn.tsx)
const createConnectivityRaster = async (georaster: any) => {
  const interpolateConnectivityColor = (value: number): string => {
    // Connectivity color mapping using colorRamp.json (same as bioConn.tsx)
    if (value < 0) return "rgba(0, 0, 255, 0)"; // Transparent for negative values

    // Normalize the value to a range of 0-255 (same as bioConn.tsx)
    const normalizedValue = Math.floor((value / 2.5) * 255);

    // Clamp the value to ensure it stays within 0-255
    const clampedValue = Math.min(Math.max(normalizedValue, 0), 255);

    // Get the corresponding color from the colorRamp.json
    const color = colorRamp[clampedValue.toString() as keyof typeof colorRamp];

    // Return the color in RGB format
    return color || "rgba(0, 0, 0, 0)"; // Default to transparent if color is not found
  };

  return new GeoRasterLayer({
    georaster: georaster,
    opacity: 0.7,
    //@ts-ignore
    pixelValuesToColorFn: (values: number[]) => {
      const value = values[0];

      if (value === undefined || value === null || isNaN(value)) {
        return null; // Transparent for NODATA
      }

      return interpolateConnectivityColor(value);
    },
    resolution: 512,
  });
};

// Function to convert base64 GeoTIFF to object structure (like original raster)
const convertBase64ToRasterObject = async (base64Data: string) => {
  try {
    // Convert base64 to ArrayBuffer
    const arrayBuffer = base64ToArrayBuffer(base64Data);

    // Parse the GeoTIFF to extract metadata and pixel data
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();

    // Get image metadata
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox(); // Extract values (assuming single band for now)
    const values = Array.from(rasters[0] as ArrayLike<number>);

    // Create object structure matching original raster format
    const rasterObject = {
      values: values,
      width: width,
      height: height,
      xmin: bbox[0],
      ymin: bbox[1],
      xmax: bbox[2],
      ymax: bbox[3],
    };

    console.log("✅ Base64 converted to raster object:", rasterObject);
    return rasterObject;
  } catch (error: any) {
    throw new Error(
      `Failed to convert base64 to raster object: ${error.message}`
    );
  }
};

// Function to create a red rectangle overlay showing the original raster bounds
const createRasterBoundsOverlay = (
  originalRasterBounds: L.LatLngBounds
): L.Rectangle => {
  return L.rectangle(originalRasterBounds, {
    color: "#ff0000",
    weight: 3,
    fillOpacity: 0,
    dashArray: "10, 10",
  });
};

// Function to process API response data using base64 to object conversion
const fetchApiResponse = async (
  apiResponseData: any,
  originalRasterArrayBuffer?: ArrayBuffer,
  storeDiagnosticData?: (data: any) => void
) => {
  try {
    let base64Data = null;

    // Handle Parse Cloud Function response format (same as getConnectivity)
    if (apiResponseData && typeof apiResponseData === "object") {
      // Check for Parse Cloud response format: { status: "success", data: "base64string" }
      if (
        apiResponseData.status === "success" &&
        apiResponseData.data &&
        typeof apiResponseData.data === "string"
      ) {
        base64Data = apiResponseData.data;
      }
      // Fallback: check for direct data property
      else if (
        apiResponseData.data &&
        typeof apiResponseData.data === "string"
      ) {
        base64Data = apiResponseData.data;
      }
      // Check for result property
      else if (
        apiResponseData.result &&
        typeof apiResponseData.result === "string"
      ) {
        base64Data = apiResponseData.result;
      }
      // Check for response property
      else if (
        apiResponseData.response &&
        typeof apiResponseData.response === "string"
      ) {
        base64Data = apiResponseData.response;
      } else {
        throw new Error(
          "API response does not contain valid base64 data in expected format"
        );
      }
    }
    // Handle direct string (base64)
    else if (typeof apiResponseData === "string") {
      base64Data = apiResponseData;
    } else {
      throw new Error(
        `Unexpected API response data type: ${typeof apiResponseData}. Expected object with base64 data or base64 string.`
      );
    }

    if (!base64Data) {
      throw new Error("No base64 data found in API response");
    }

    // Convert base64 to raster object (same structure as original raster)
    const rasterObject = await convertBase64ToRasterObject(base64Data);

    // First convert the raster object to a geoblaze-compatible format (same as original raster)
    const geoblazeRaster = await convertToGeoblazeRaster(rasterObject);

    // Then use the connectivity color mapping for the raster layer (same as leftmost map)
    const rasterLayer = await createConnectivityRaster(geoblazeRaster);

    return rasterLayer;
  } catch (error: any) {
    // Re-throw with more context
    throw new Error(`Failed to process API response data: ${error.message}`);
  }
};

const CompareScenario: React.FC<CompareScenarioProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const connectivityMapInstance = useRef<L.Map | null>(null);
  const rightMapInstance = useRef<L.Map | null>(null);
  const connectivityMapContainerRef = useRef<HTMLDivElement | null>(null);
  const rightMapContainerRef = useRef<HTMLDivElement | null>(null);

  // Add refs to track layer loading states and sync timeout
  const connectivityLayerRef = useRef<any>(null);
  const rightLayerRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Species-related state from bioConn.tsx
  const [speciesOption, setSpeciesOption] = useState<"all" | "specific">("all");
  const [gbifQuery, setGbifQuery] = useState("");
  const [gbifSuggestions, setGbifSuggestions] = useState<GbifSpecies[]>([]);
  const [selectedTaxonKey, setSelectedTaxonKey] = useState<number | null>(null);
  const [occurrenceData, setOccurrenceData] = useState<GbifOccurrence[]>([]);

  // Layer option state for legend
  const [layerOption, setLayerOption] = useState<"connectivity" | "muscsc">(
    "connectivity"
  );

  const [diagnosticData, setDiagnosticData] = useState<{
    originalAnalysis?: GeoTiffAnalysis;
    apiAnalysis?: GeoTiffAnalysis;
    comparisonResults?: { differences: string[]; criticalIssues: string[] };
  }>({});

  // State to store download data
  const [originalRasterDownloadData, setOriginalRasterDownloadData] =
    useState<ArrayBuffer | null>(null);
  const [isOriginalRasterFromFile, setIsOriginalRasterFromFile] =
    useState<boolean>(false);
  const [apiResponseDownloadData, setApiResponseDownloadData] = useState<
    string | null
  >(null);

  // Layer control states
  const [mapView, setMapView] = useState<"side-by-side" | "overlay">(
    "side-by-side"
  );
  const [showConnectivityIndex, setShowConnectivityIndex] =
    useState<boolean>(true);
  const [showApiResponse, setShowApiResponse] = useState<boolean>(true);
  const [baseLayer, setBaseLayer] = useState<"satellite" | "osm">("satellite");

  // BioConn-style layer controls
  const [checkboxOptions, setCheckboxOptions] = useState<CheckboxOptions>({
    satellite: false,
    roads: false,
    protectedAreas: false,
    natura2000: false,
    enpe: false,
    pein: false,
    aquaticProtected: false,
    riversWaterBodies: false,
    cadastral: false,
  });

  // Layer references for overlay mode
  const satelliteLayerRef = useRef<any>(null);
  const osmLayerRef = useRef<any>(null);
  const overlayConnectivityLayerRef = useRef<any>(null);
  const overlayApiLayerRef = useRef<any>(null);
  const overlayMapRef = useRef<HTMLDivElement>(null);
  const overlayMapInstance = useRef<L.Map | null>(null);

  // Additional layer references for BioConn-style layers - store separate instances for each map
  const additionalLayersRef = useRef<{
    roads: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    satellite: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    natura2000: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    enpe: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    pein: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    aquaticProtected: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
    riversWaterBodies: {
      connectivity?: L.TileLayer.WMS;
      right?: L.TileLayer.WMS;
      overlay?: L.TileLayer.WMS;
    };
  }>({
    roads: {},
    satellite: {},
    natura2000: {},
    enpe: {},
    pein: {},
    aquaticProtected: {},
    riversWaterBodies: {},
  });
  // Helper function to ensure API response layer is always on top in the right map
  const bringApiResponseLayerToTop = () => {
    console.log("bringApiResponseLayerToTop called");

    if (rightMapInstance.current && rightLayerRef.current) {
      console.log("Bringing API response layer to top in right map");

      try {
        // Bring the API response layer to the front
        rightLayerRef.current.bringToFront();
        console.log("✅ API response layer brought to front successfully");
      } catch (error) {
        console.warn("Failed to bring API response layer to front:", error);
      }

      // Note: Red rectangle overlay and mask layers are added after the API layer,
      // so they will naturally be on top where needed
    } else {
      console.log(
        "No right map instance or API response layer to bring to front",
        {
          rightMap: !!rightMapInstance.current,
          apiLayer: !!rightLayerRef.current,
        }
      );
    }
  };

  // Species-related functions from bioConn.tsx
  const searchGbifSpecies = async (query: string) => {
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

  // Function to check if a point is within Catalonia using bounding box
  const isPointInCatalonia = (lat: number, lng: number): boolean => {
    return (
      lng >= CATALONIA_BBOX[0] &&
      lng <= CATALONIA_BBOX[2] &&
      lat >= CATALONIA_BBOX[1] &&
      lat <= CATALONIA_BBOX[3]
    );
  };

  const fetchGbifOccurrences = async () => {
    if (!selectedTaxonKey) return;

    setIsLoading(true);
    try {
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

      const filteredOccurrences = data.results.filter((occ: GbifOccurrence) => {
        if (!occ.decimalLatitude || !occ.decimalLongitude) return false;
        return isPointInCatalonia(occ.decimalLatitude, occ.decimalLongitude);
      });

      setOccurrenceData(filteredOccurrences);
      plotOccurrences(filteredOccurrences);

      console.log(
        `Loaded ${filteredOccurrences.length} occurrences within Catalonia from ${data.results.length} total for ${gbifQuery}`
      );
    } catch (error) {
      console.error("GBIF occurrence fetch error:", error);
      setError("Failed to load species data");
    } finally {
      setIsLoading(false);
    }
  };

  const plotOccurrences = (occurrences: GbifOccurrence[]) => {
    const maps = getActiveMaps();

    maps.forEach((map) => {
      // Clear previous occurrences
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // Plot new occurrences
      occurrences.forEach((occ: GbifOccurrence) => {
        if (occ.decimalLatitude && occ.decimalLongitude) {
          const marker = L.circleMarker(
            [occ.decimalLatitude, occ.decimalLongitude],
            {
              radius: 6,
              fillColor: "#ff7800",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8,
            }
          );

          let popupContent = `
            <div style="font-family: Arial, sans-serif; max-width: 350px; line-height: 1.2;">
              <h4 style="margin: 0 0 8px 0; color: #1890ff; border-bottom: 1px solid #ddd; padding-bottom: 4px;">
                ${occ.scientificName || gbifQuery || "Species Occurrence"}
              </h4>
          `;

          if (occ.vernacularName) {
            popupContent += `<p style="margin: 2px 0; font-style: italic; color: #666; font-size: 13px;">
              Common name: ${occ.vernacularName}
            </p>`;
          }

          popupContent += `
            <div style="margin: 6px 0;">
              <strong>📍 Location:</strong><br>
              <span style="font-size: 11px;">
                Lat: ${occ.decimalLatitude.toFixed(
                  6
                )}, Lng: ${occ.decimalLongitude.toFixed(6)}
              </span>
          `;

          if (occ.locality) {
            popupContent += `<br><span style="font-size: 11px;">${occ.locality}</span>`;
          }
          if (occ.stateProvince) {
            popupContent += `<br><span style="font-size: 11px;">${occ.stateProvince}</span>`;
          }
          if (occ.country) {
            popupContent += `<br><span style="font-size: 11px;">${occ.country}</span>`;
          }
          popupContent += `</div>`;

          if (occ.eventDate) {
            const date = new Date(occ.eventDate).toLocaleDateString();
            popupContent += `<p style="margin: 2px 0;"><strong>📅 Date:</strong> ${date}</p>`;
          }

          if (occ.basisOfRecord) {
            popupContent += `<p style="margin: 2px 0;"><strong>📋 Basis:</strong> ${occ.basisOfRecord}</p>`;
          }

          if (occ.recordedBy) {
            popupContent += `<p style="margin: 2px 0;"><strong>👤 Recorded by:</strong> ${occ.recordedBy}</p>`;
          }

          popupContent += `
            <div style="margin-top: 8px; text-align: center; border-top: 1px solid #ddd; padding-top: 6px;">
              <a href="https://www.gbif.org/occurrence/${occ.key}" target="_blank" 
                 style="color: #1890ff; text-decoration: none; font-weight: bold; font-size: 12px;">
                🔗 View full record on GBIF
              </a>
            </div>
          </div>`;

          marker.bindPopup(popupContent, {
            maxWidth: 400,
            closeButton: true,
            autoPan: true,
          });

          marker.on("mouseover", function (this: L.CircleMarker) {
            this.setStyle({
              radius: 8,
              fillOpacity: 1,
            });
          });

          marker.on("mouseout", function (this: L.CircleMarker) {
            this.setStyle({
              radius: 6,
              fillOpacity: 0.8,
            });
          });

          marker.addTo(map);
        }
      });
    });
  };

  const resetSpeciesSelection = () => {
    setSelectedTaxonKey(null);
    setGbifQuery("");
    setGbifSuggestions([]);
    setOccurrenceData([]);

    const maps = getActiveMaps();
    maps.forEach((map) => {
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });
    });

    console.log("Species selection and occurrences cleared");
  };

  const handleSpeciesChange = (e: any) => {
    setSpeciesOption(e.target.value);

    if (e.target.value === "all") {
      setSelectedTaxonKey(null);
      setGbifQuery("");
      setGbifSuggestions([]);
      setOccurrenceData([]);

      const maps = getActiveMaps();
      maps.forEach((map) => {
        map.eachLayer((layer) => {
          if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
          }
        });
      });
    }
  };

  // Helper function to get currently active maps based on view mode
  const getActiveMaps = (): L.Map[] => {
    const maps: L.Map[] = [];

    if (mapView === "overlay") {
      if (overlayMapInstance.current) {
        maps.push(overlayMapInstance.current);
      }
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        maps.push(connectivityMapInstance.current);
      }
      if (rightMapInstance.current) {
        maps.push(rightMapInstance.current);
      }
    }

    console.log(
      `getActiveMaps: mapView=${mapView}, found ${maps.length} maps`,
      {
        connectivity: !!connectivityMapInstance.current,
        right: !!rightMapInstance.current,
        overlay: !!overlayMapInstance.current,
      }
    );

    return maps;
  };

  // Handle checkbox changes (same as BioConn)
  const handleCheckboxChange = (option: keyof CheckboxOptions) => {
    console.log(`handleCheckboxChange called for: ${option}`);
    const newValue = !checkboxOptions[option];
    console.log(`Setting ${option} to: ${newValue}`);

    setCheckboxOptions((prev) => ({
      ...prev,
      [option]: newValue,
    }));

    // Handle specific layers
    if (option === "satellite") {
      if (newValue) {
        console.log("Calling addSatelliteLayer from handleCheckboxChange");
        addSatelliteLayer();
      } else {
        console.log("Calling removeSatelliteLayer from handleCheckboxChange");
        removeSatelliteLayer();
      }
    } else if (option === "roads") {
      if (newValue) {
        console.log("Calling addRoadsLayer from handleCheckboxChange");
        addRoadsLayer();
      } else {
        console.log("Calling removeRoadsLayer from handleCheckboxChange");
        removeRoadsLayer();
      }
    } else if (option === "riversWaterBodies") {
      if (newValue) {
        console.log(
          "Calling addRiversWaterBodiesLayer from handleCheckboxChange"
        );
        addRiversWaterBodiesLayer();
      } else {
        console.log(
          "Calling removeRiversWaterBodiesLayer from handleCheckboxChange"
        );
        removeRiversWaterBodiesLayer();
      }
    } else if (option === "natura2000") {
      if (newValue) {
        console.log("Calling addNatura2000Layer from handleCheckboxChange");
        addNatura2000Layer();
      } else {
        console.log("Calling removeNatura2000Layer from handleCheckboxChange");
        removeNatura2000Layer();
      }
    } else if (option === "enpe") {
      if (newValue) {
        console.log("Calling addEnpeLayer from handleCheckboxChange");
        addEnpeLayer();
      } else {
        console.log("Calling removeEnpeLayer from handleCheckboxChange");
        removeEnpeLayer();
      }
    } else if (option === "pein") {
      if (newValue) {
        console.log("Calling addPeinLayer from handleCheckboxChange");
        addPeinLayer();
      } else {
        console.log("Calling removePeinLayer from handleCheckboxChange");
        removePeinLayer();
      }
    } else if (option === "aquaticProtected") {
      if (newValue) {
        console.log(
          "Calling addAquaticProtectedLayer from handleCheckboxChange"
        );
        addAquaticProtectedLayer();
      } else {
        console.log(
          "Calling removeAquaticProtectedLayer from handleCheckboxChange"
        );
        removeAquaticProtectedLayer();
      }
    } else if (option === "cadastral") {
      if (newValue) {
        console.log("Calling addCadastralLayer from handleCheckboxChange");
        addCadastralLayer();
      } else {
        console.log("Calling removeCadastralLayer from handleCheckboxChange");
        removeCadastralLayer();
      }
    }
  };

  // Layer management functions
  const addSatelliteLayer = () => {
    console.log("addSatelliteLayer called");

    // Remove existing satellite layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.satellite.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.connectivity
      );
      additionalLayersRef.current.satellite.connectivity = undefined;
    }
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.satellite.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.right
      );
      additionalLayersRef.current.satellite.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.satellite.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.overlay
      );
      additionalLayersRef.current.satellite.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding satellite layer to overlay map");
      const satelliteLayer = L.tileLayer.wms(
        "https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms",
        {
          layers: "ortofoto_color_vigent",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          opacity: 1.0,
        }
      );
      satelliteLayer.addTo(overlayMapInstance.current);
      satelliteLayer.bringToFront();
      additionalLayersRef.current.satellite.overlay = satelliteLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding satellite layer to connectivity map");
        const satelliteLayerLeft = L.tileLayer.wms(
          "https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms",
          {
            layers: "ortofoto_color_vigent",
            format: "image/png",
            transparent: true,
            version: "1.3.0",
            opacity: 1.0,
          }
        );
        satelliteLayerLeft.addTo(connectivityMapInstance.current);
        satelliteLayerLeft.bringToFront();
        additionalLayersRef.current.satellite.connectivity = satelliteLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding satellite layer to right map");
        const satelliteLayerRight = L.tileLayer.wms(
          "https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms",
          {
            layers: "ortofoto_color_vigent",
            format: "image/png",
            transparent: true,
            version: "1.3.0",
            opacity: 1.0,
          }
        );
        satelliteLayerRight.addTo(rightMapInstance.current);
        satelliteLayerRight.bringToFront();
        additionalLayersRef.current.satellite.right = satelliteLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeSatelliteLayer = () => {
    console.log("removeSatelliteLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.satellite.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.connectivity
      );
      additionalLayersRef.current.satellite.connectivity = undefined;
    }

    // Remove from right map
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.satellite.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.right
      );
      additionalLayersRef.current.satellite.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.satellite.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.satellite.overlay
      );
      additionalLayersRef.current.satellite.overlay = undefined;
    }
  };

  // Roads layer management
  const addRoadsLayer = () => {
    console.log("addRoadsLayer called");
    console.log("Map instances check:", {
      connectivity: !!connectivityMapInstance.current,
      right: !!rightMapInstance.current,
      overlay: !!overlayMapInstance.current,
      mapView: mapView,
    });

    // Remove existing roads layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.roads.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.connectivity
      );
      additionalLayersRef.current.roads.connectivity = undefined;
    }
    if (rightMapInstance.current && additionalLayersRef.current.roads.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.right
      );
      additionalLayersRef.current.roads.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.roads.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.overlay
      );
      additionalLayersRef.current.roads.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding roads layer to overlay map");
      const roadsLayer = L.tileLayer.wms(
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
      roadsLayer.addTo(overlayMapInstance.current);
      roadsLayer.bringToFront();
      additionalLayersRef.current.roads.overlay = roadsLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding roads layer to connectivity map");
        const roadsLayerLeft = L.tileLayer.wms(
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
        roadsLayerLeft.addTo(connectivityMapInstance.current);
        roadsLayerLeft.bringToFront();
        additionalLayersRef.current.roads.connectivity = roadsLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding roads layer to right map");
        const roadsLayerRight = L.tileLayer.wms(
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
        roadsLayerRight.addTo(rightMapInstance.current);
        roadsLayerRight.bringToFront();
        additionalLayersRef.current.roads.right = roadsLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeRoadsLayer = () => {
    console.log("removeRoadsLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.roads.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.connectivity
      );
      additionalLayersRef.current.roads.connectivity = undefined;
    }

    // Remove from right map
    if (rightMapInstance.current && additionalLayersRef.current.roads.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.right
      );
      additionalLayersRef.current.roads.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.roads.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.roads.overlay
      );
      additionalLayersRef.current.roads.overlay = undefined;
    }
  };

  // Rivers and Water Bodies layer management
  const addRiversWaterBodiesLayer = () => {
    console.log("addRiversWaterBodiesLayer called");

    // Remove existing layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.connectivity
      );
      additionalLayersRef.current.riversWaterBodies.connectivity = undefined;
    }
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.right
      );
      additionalLayersRef.current.riversWaterBodies.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.overlay
      );
      additionalLayersRef.current.riversWaterBodies.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding rivers/water bodies layer to overlay map");
      const riverLayer = L.tileLayer.wms(
        "https://geoserveis.ide.cat/servei/catalunya/inspire-hidrografia/wms",
        {
          layers: "HY.PhysicalWaters.Waterbodies",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "HY.PhysicalWaters.Waterbodies.Default",
          opacity: 0.7,
        }
      );
      riverLayer.addTo(overlayMapInstance.current);
      riverLayer.bringToFront();
      additionalLayersRef.current.riversWaterBodies.overlay = riverLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding rivers/water bodies layer to connectivity map");
        const riverLayerLeft = L.tileLayer.wms(
          "https://geoserveis.ide.cat/servei/catalunya/inspire-hidrografia/wms",
          {
            layers: "HY.PhysicalWaters.Waterbodies",
            format: "image/png",
            transparent: true,
            version: "1.3.0",
            styles: "HY.PhysicalWaters.Waterbodies.Default",
            opacity: 0.7,
          }
        );
        riverLayerLeft.addTo(connectivityMapInstance.current);
        riverLayerLeft.bringToFront();
        additionalLayersRef.current.riversWaterBodies.connectivity =
          riverLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding rivers/water bodies layer to right map");
        const riverLayerRight = L.tileLayer.wms(
          "https://geoserveis.ide.cat/servei/catalunya/inspire-hidrografia/wms",
          {
            layers: "HY.PhysicalWaters.Waterbodies",
            format: "image/png",
            transparent: true,
            version: "1.3.0",
            styles: "HY.PhysicalWaters.Waterbodies.Default",
            opacity: 0.7,
          }
        );
        riverLayerRight.addTo(rightMapInstance.current);
        riverLayerRight.bringToFront();
        additionalLayersRef.current.riversWaterBodies.right = riverLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeRiversWaterBodiesLayer = () => {
    console.log("removeRiversWaterBodiesLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.connectivity
      );
      additionalLayersRef.current.riversWaterBodies.connectivity = undefined;
    }

    // Remove from right map
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.right
      );
      additionalLayersRef.current.riversWaterBodies.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.riversWaterBodies.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.riversWaterBodies.overlay
      );
      additionalLayersRef.current.riversWaterBodies.overlay = undefined;
    }
  };

  // Natura 2000 layer management
  const addNatura2000Layer = () => {
    console.log("addNatura2000Layer called");

    // Remove existing layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.natura2000.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.connectivity
      );
      additionalLayersRef.current.natura2000.connectivity = undefined;
    }
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.natura2000.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.right
      );
      additionalLayersRef.current.natura2000.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.natura2000.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.overlay
      );
      additionalLayersRef.current.natura2000.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding Natura 2000 layer to overlay map");
      const natura2000Layer = L.tileLayer.wms(
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
      natura2000Layer.addTo(overlayMapInstance.current);
      natura2000Layer.bringToFront();
      additionalLayersRef.current.natura2000.overlay = natura2000Layer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding Natura 2000 layer to connectivity map");
        const natura2000LayerLeft = L.tileLayer.wms(
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
        natura2000LayerLeft.addTo(connectivityMapInstance.current);
        natura2000LayerLeft.bringToFront();
        additionalLayersRef.current.natura2000.connectivity =
          natura2000LayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding Natura 2000 layer to right map");
        const natura2000LayerRight = L.tileLayer.wms(
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
        natura2000LayerRight.addTo(rightMapInstance.current);
        natura2000LayerRight.bringToFront();
        additionalLayersRef.current.natura2000.right = natura2000LayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeNatura2000Layer = () => {
    console.log("removeNatura2000Layer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.natura2000.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.connectivity
      );
      additionalLayersRef.current.natura2000.connectivity = undefined;
    }

    // Remove from right map
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.natura2000.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.right
      );
      additionalLayersRef.current.natura2000.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.natura2000.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.natura2000.overlay
      );
      additionalLayersRef.current.natura2000.overlay = undefined;
    }
  };

  // ENPE layer management
  const addEnpeLayer = () => {
    console.log("addEnpeLayer called");

    // Remove existing layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.enpe.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.connectivity
      );
      additionalLayersRef.current.enpe.connectivity = undefined;
    }
    if (rightMapInstance.current && additionalLayersRef.current.enpe.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.right
      );
      additionalLayersRef.current.enpe.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.enpe.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.overlay
      );
      additionalLayersRef.current.enpe.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding ENPE layer to overlay map");
      const enpeLayer = L.tileLayer.wms(
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
      enpeLayer.addTo(overlayMapInstance.current);
      enpeLayer.bringToFront();
      additionalLayersRef.current.enpe.overlay = enpeLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding ENPE layer to connectivity map");
        const enpeLayerLeft = L.tileLayer.wms(
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
        enpeLayerLeft.addTo(connectivityMapInstance.current);
        enpeLayerLeft.bringToFront();
        additionalLayersRef.current.enpe.connectivity = enpeLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding ENPE layer to right map");
        const enpeLayerRight = L.tileLayer.wms(
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
        enpeLayerRight.addTo(rightMapInstance.current);
        enpeLayerRight.bringToFront();
        additionalLayersRef.current.enpe.right = enpeLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeEnpeLayer = () => {
    console.log("removeEnpeLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.enpe.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.connectivity
      );
      additionalLayersRef.current.enpe.connectivity = undefined;
    }

    // Remove from right map
    if (rightMapInstance.current && additionalLayersRef.current.enpe.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.right
      );
      additionalLayersRef.current.enpe.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.enpe.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.enpe.overlay
      );
      additionalLayersRef.current.enpe.overlay = undefined;
    }
  };

  // PEIN layer management
  const addPeinLayer = () => {
    console.log("addPeinLayer called");

    // Remove existing layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.pein.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.connectivity
      );
      additionalLayersRef.current.pein.connectivity = undefined;
    }
    if (rightMapInstance.current && additionalLayersRef.current.pein.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.right
      );
      additionalLayersRef.current.pein.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.pein.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.overlay
      );
      additionalLayersRef.current.pein.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding PEIN layer to overlay map");
      const peinLayer = L.tileLayer.wms(
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
      peinLayer.addTo(overlayMapInstance.current);
      peinLayer.bringToFront();
      additionalLayersRef.current.pein.overlay = peinLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding PEIN layer to connectivity map");
        const peinLayerLeft = L.tileLayer.wms(
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
        peinLayerLeft.addTo(connectivityMapInstance.current);
        peinLayerLeft.bringToFront();
        additionalLayersRef.current.pein.connectivity = peinLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding PEIN layer to right map");
        const peinLayerRight = L.tileLayer.wms(
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
        peinLayerRight.addTo(rightMapInstance.current);
        peinLayerRight.bringToFront();
        additionalLayersRef.current.pein.right = peinLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removePeinLayer = () => {
    console.log("removePeinLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.pein.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.connectivity
      );
      additionalLayersRef.current.pein.connectivity = undefined;
    }

    // Remove from right map
    if (rightMapInstance.current && additionalLayersRef.current.pein.right) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.right
      );
      additionalLayersRef.current.pein.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.pein.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.pein.overlay
      );
      additionalLayersRef.current.pein.overlay = undefined;
    }
  };

  // Aquatic Protected Areas layer management
  const addAquaticProtectedLayer = () => {
    console.log("addAquaticProtectedLayer called");

    // Remove existing layers if any
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.connectivity
      );
      additionalLayersRef.current.aquaticProtected.connectivity = undefined;
    }
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.right
      );
      additionalLayersRef.current.aquaticProtected.right = undefined;
    }
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.overlay
      );
      additionalLayersRef.current.aquaticProtected.overlay = undefined;
    }

    // Create and add layers based on current view mode
    if (mapView === "overlay" && overlayMapInstance.current) {
      console.log("Adding Aquatic Protected Areas layer to overlay map");
      const aquaticLayer = L.tileLayer.wms(
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
      aquaticLayer.addTo(overlayMapInstance.current);
      aquaticLayer.bringToFront();
      additionalLayersRef.current.aquaticProtected.overlay = aquaticLayer;
    } else {
      // Side-by-side view
      if (connectivityMapInstance.current) {
        console.log("Adding Aquatic Protected Areas layer to connectivity map");
        const aquaticLayerLeft = L.tileLayer.wms(
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
        aquaticLayerLeft.addTo(connectivityMapInstance.current);
        aquaticLayerLeft.bringToFront();
        additionalLayersRef.current.aquaticProtected.connectivity =
          aquaticLayerLeft;
      }

      if (rightMapInstance.current) {
        console.log("Adding Aquatic Protected Areas layer to right map");
        const aquaticLayerRight = L.tileLayer.wms(
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
        aquaticLayerRight.addTo(rightMapInstance.current);
        aquaticLayerRight.bringToFront();
        additionalLayersRef.current.aquaticProtected.right = aquaticLayerRight;

        // Ensure API response layer stays on top in right map
        setTimeout(() => bringApiResponseLayerToTop(), 50);
      }
    }
  };

  const removeAquaticProtectedLayer = () => {
    console.log("removeAquaticProtectedLayer called");

    // Remove from connectivity map
    if (
      connectivityMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.connectivity
    ) {
      connectivityMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.connectivity
      );
      additionalLayersRef.current.aquaticProtected.connectivity = undefined;
    }

    // Remove from right map
    if (
      rightMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.right
    ) {
      rightMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.right
      );
      additionalLayersRef.current.aquaticProtected.right = undefined;
    }

    // Remove from overlay map
    if (
      overlayMapInstance.current &&
      additionalLayersRef.current.aquaticProtected.overlay
    ) {
      overlayMapInstance.current.removeLayer(
        additionalLayersRef.current.aquaticProtected.overlay
      );
      additionalLayersRef.current.aquaticProtected.overlay = undefined;
    }
  };

  // Cadastral layer management
  const addCadastralLayer = async () => {
    console.log("addCadastralLayer called");

    // Get active maps
    const maps = getActiveMaps();

    for (const map of maps) {
      try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

        const result = await Parse.Cloud.run("getCadastralWMS", {
          bbox: bbox,
          width: 512,
          height: 512,
        });

        if (result.status !== "success" || !result.data) {
          throw new Error("Failed to fetch cadastral data");
        }

        const binaryString = atob(result.data);
        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uintArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < binaryString.length; i++) {
          uintArray[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: "image/png" });
        const imageUrl = URL.createObjectURL(blob);

        const cadastralOverlay = L.imageOverlay(
          imageUrl,
          [
            [bounds.getSouth(), bounds.getWest()],
            [bounds.getNorth(), bounds.getEast()],
          ],
          {
            opacity: 0.7,
          }
        );

        cadastralOverlay.addTo(map);

        // Store reference based on which map this is
        if (map === connectivityMapInstance.current) {
          (additionalLayersRef.current as any).cadastral = {
            ...(additionalLayersRef.current as any).cadastral,
            connectivity: cadastralOverlay,
          };
        } else if (map === rightMapInstance.current) {
          (additionalLayersRef.current as any).cadastral = {
            ...(additionalLayersRef.current as any).cadastral,
            right: cadastralOverlay,
          };
        } else if (map === overlayMapInstance.current) {
          (additionalLayersRef.current as any).cadastral = {
            ...(additionalLayersRef.current as any).cadastral,
            overlay: cadastralOverlay,
          };
        }

        setTimeout(() => {
          URL.revokeObjectURL(imageUrl);
        }, 5000);
      } catch (err) {
        console.error("Error adding Cadastral layer:", err);
        setError(
          `Failed to load Cadastral layer: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }
  };

  const removeCadastralLayer = () => {
    console.log("removeCadastralLayer called");

    // Remove from all maps
    const cadastralLayers =
      (additionalLayersRef.current as any).cadastral || {};

    Object.entries(cadastralLayers).forEach(
      ([mapType, layer]: [string, any]) => {
        if (layer) {
          const map =
            mapType === "connectivity"
              ? connectivityMapInstance.current
              : mapType === "right"
              ? rightMapInstance.current
              : mapType === "overlay"
              ? overlayMapInstance.current
              : null;

          if (map && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        }
      }
    );

    // Clear all cadastral layer references
    (additionalLayersRef.current as any).cadastral = {};
  };

  // Debounced sync function to prevent rapid zoom events from causing issues
  const debouncedSync = useCallback((sourceMap: L.Map, targetMaps: L.Map[]) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      targetMaps.forEach((targetMap) => {
        if (targetMap && sourceMap !== targetMap) {
          try {
            targetMap.setView(sourceMap.getCenter(), sourceMap.getZoom(), {
              animate: false,
            });
          } catch (error) {
            console.warn("Map sync error:", error);
          }
        }
      });
    }, 50); // 50ms debounce
  }, []);

  // Helper function to apply all currently active layers to maps
  const applyActiveLayersToMaps = () => {
    console.log(
      "applyActiveLayersToMaps called with checkboxOptions:",
      checkboxOptions
    );

    // Apply each active layer to the current maps
    if (checkboxOptions.satellite) {
      console.log("Applying satellite layer from applyActiveLayersToMaps");
      addSatelliteLayer();
    }

    if (checkboxOptions.roads) {
      console.log("Applying roads layer from applyActiveLayersToMaps");
      addRoadsLayer();
    }

    if (checkboxOptions.riversWaterBodies) {
      console.log(
        "Applying rivers/water bodies layer from applyActiveLayersToMaps"
      );
      addRiversWaterBodiesLayer();
    }

    if (checkboxOptions.natura2000) {
      console.log("Applying Natura 2000 layer from applyActiveLayersToMaps");
      addNatura2000Layer();
    }

    if (checkboxOptions.enpe) {
      console.log("Applying ENPE layer from applyActiveLayersToMaps");
      addEnpeLayer();
    }

    if (checkboxOptions.pein) {
      console.log("Applying PEIN layer from applyActiveLayersToMaps");
      addPeinLayer();
    }

    if (checkboxOptions.aquaticProtected) {
      console.log(
        "Applying Aquatic Protected Areas layer from applyActiveLayersToMaps"
      );
      addAquaticProtectedLayer();
    }

    // After applying all layers, ensure API response layer is on top in right map
    setTimeout(() => bringApiResponseLayerToTop(), 100);
  };

  // Single effect that handles both data validation and map initialization
  useEffect(() => {
    const initializeData = async () => {
      const { originalRaster, apiResponse } = (location as any).state || {};

      console.log("apiResponse", apiResponse);

      if (!originalRaster) {
        setError("Missing original raster data. Please go back and try again.");
        setIsLoading(false);
        return;
      }

      // Process original raster using the convertToGeoblazeRaster function
      let parsedOriginalRaster;
      let originalRasterArrayBuffer: ArrayBuffer | null = null;

      try {
        parsedOriginalRaster = await convertToGeoblazeRaster(originalRaster);

        // Check for downloadable GeoTIFF from bioConnScenario first
        if (originalRaster.downloadableGeoTiff) {
          // Use the downloadable GeoTIFF ArrayBuffer created in bioConnScenario
          originalRasterArrayBuffer = originalRaster.downloadableGeoTiff;
          console.log("✅ Using downloadable GeoTIFF from bioConnScenario");
        }
        // If the original raster has a source GeoTIFF file, try to get its ArrayBuffer for comparison
        else if (originalRaster.sourceFile) {
          // If we have the source file, read it to ArrayBuffer
          const reader = new FileReader();
          originalRasterArrayBuffer = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(originalRaster.sourceFile);
          });
        } else if (originalRaster.arrayBuffer) {
          // If we already have an ArrayBuffer
          originalRasterArrayBuffer = originalRaster.arrayBuffer;
        } else {
          console.warn(
            "Original raster ArrayBuffer not available for comparison"
          );
        }

        // Store the ArrayBuffer for download purposes
        if (originalRasterArrayBuffer) {
          setOriginalRasterDownloadData(originalRasterArrayBuffer);
          setIsOriginalRasterFromFile(true);
          console.log("✅ Original raster ArrayBuffer stored for download");
        } else {
          console.warn(
            "❌ No ArrayBuffer available for original raster download"
          );
          console.log("Original raster structure:", originalRaster);

          // Try to create ArrayBuffer from processed raster data
          try {
            if (parsedOriginalRaster && parsedOriginalRaster.values) {
              console.log(
                "🔄 Attempting to create GeoTIFF from processed raster data"
              );
              const fallbackArrayBuffer = await createGeoTiffFromRasterData(
                parsedOriginalRaster
              );
              setOriginalRasterDownloadData(fallbackArrayBuffer);
              setIsOriginalRasterFromFile(false);
              console.log("✅ Fallback GeoTIFF created for download");
            }
          } catch (fallbackError) {
            console.warn(
              "Failed to create fallback download data:",
              fallbackError
            );
          }
        }
      } catch (error: any) {
        setError(`Error processing original raster: ${error.message}`);
        setIsLoading(false);
        return;
      }

      // Don't initialize if containers are not ready or maps already exist
      if (
        !connectivityMapContainerRef.current ||
        !rightMapContainerRef.current
      ) {
        return;
      }

      if (connectivityMapInstance.current || rightMapInstance.current) {
        return;
      }

      const initializeMaps = async () => {
        try {
          // Fix leaflet's default icon issue
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          });

          // Variable to store the bounds of the original raster
          let originalRasterBounds: L.LatLngBounds | null = null;

          // Create connectivity and right maps with the same center and zoom
          connectivityMapInstance.current = L.map(
            connectivityMapContainerRef.current!
          ).setView([41.7, 1.7], 7);
          rightMapInstance.current = L.map(
            rightMapContainerRef.current!
          ).setView([41.7, 1.7], 7);

          // Force maps to invalidate size after creation
          setTimeout(() => {
            if (connectivityMapInstance.current && rightMapInstance.current) {
              connectivityMapInstance.current.invalidateSize();
              rightMapInstance.current.invalidateSize();
            }
          }, 100);

          // Add tile layers to maps
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(connectivityMapInstance.current);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(rightMapInstance.current);

          // Fetch and add connectivity index to the left (connectivity) map
          try {
            const connectivityGeoraster = await fetchConnectivityIndex();
            const connectivityRasterLayer = await createConnectivityRaster(
              connectivityGeoraster
            );
            if (connectivityMapInstance.current && connectivityRasterLayer) {
              connectivityRasterLayer.addTo(connectivityMapInstance.current);
              connectivityLayerRef.current = connectivityRasterLayer; // Store ref to layer
            }
          } catch (connectivityError: any) {
            setError(
              `Error displaying connectivity index: ${connectivityError.message}`
            );
          }

          // Add original raster layer to center map - removed since we don't have middle map anymore
          // We'll keep the bounds calculation for the red rectangle overlay
          try {
            const originalRasterLayer = await createRaster(
              parsedOriginalRaster,
              0.8
            );

            // Get the bounds of the original raster for the red rectangle overlay
            originalRasterBounds = originalRasterLayer.getBounds();

            // Add red rectangle overlay to connectivity map showing original raster bounds
            if (
              connectivityMapInstance.current &&
              originalRasterBounds &&
              originalRasterBounds.isValid()
            ) {
              const redRectangle =
                createRasterBoundsOverlay(originalRasterBounds);
              redRectangle.addTo(connectivityMapInstance.current);
            }

            // Fit maps to the raster bounds
            try {
              if (originalRasterBounds && originalRasterBounds.isValid()) {
                connectivityMapInstance.current?.fitBounds(
                  originalRasterBounds
                );
                rightMapInstance.current?.fitBounds(originalRasterBounds);
              }
            } catch (boundsError) {
              // Silently handle bounds fitting errors
            }
          } catch (rasterError: any) {
            setError(
              `Error processing original raster: ${rasterError.message}`
            );
          }

          // Sync connectivity and right maps' zoom and pan using debounced function
          connectivityMapInstance.current.on("move", () => {
            if (connectivityMapInstance.current) {
              debouncedSync(connectivityMapInstance.current, [
                rightMapInstance.current!,
              ]);
            }
          });

          rightMapInstance.current.on("move", () => {
            if (rightMapInstance.current) {
              debouncedSync(rightMapInstance.current, [
                connectivityMapInstance.current!,
              ]);
            }
          });

          // Apply any currently active layers to the newly created maps
          setTimeout(() => {
            applyActiveLayersToMaps();
          }, 200); // Small delay to ensure maps are fully ready

          // Process API response data and display on right map
          if (apiResponse) {
            try {
              // First, add the connectivity layer to the right map (same as left map)
              try {
                const connectivityGeoraster = await fetchConnectivityIndex();
                const connectivityRasterLayer = await createConnectivityRaster(
                  connectivityGeoraster
                );
                if (rightMapInstance.current && connectivityRasterLayer) {
                  connectivityRasterLayer.addTo(rightMapInstance.current);
                  connectivityRasterLayer.setOpacity(0.5); // Make it more transparent on right map
                }
              } catch (connError: any) {
                console.warn(
                  "Could not add connectivity layer to right map:",
                  connError
                );
              }

              // Determine the correct raster data structure
              let rasterData = null;

              // Function to check if an object has raster properties
              const hasRasterProperties = (obj: any): boolean => {
                return (
                  obj &&
                  typeof obj === "object" &&
                  obj.values !== undefined &&
                  obj.width !== undefined &&
                  obj.height !== undefined &&
                  obj.xmin !== undefined &&
                  obj.ymin !== undefined &&
                  obj.xmax !== undefined &&
                  obj.ymax !== undefined
                );
              };

              // Function to recursively search for raster data
              const findRasterData = (obj: any, path: string = ""): any => {
                if (hasRasterProperties(obj)) {
                  return obj;
                }

                if (obj && typeof obj === "object" && !Array.isArray(obj)) {
                  for (const [key, value] of Object.entries(obj)) {
                    const result = findRasterData(
                      value,
                      path ? `${path}.${key}` : key
                    );
                    if (result) return result;
                  }
                }

                return null;
              };

              // Try different possible structures systematically
              if (hasRasterProperties(apiResponse)) {
                rasterData = apiResponse;
              } else if (typeof apiResponse === "string") {
                rasterData = apiResponse;
              } else if (apiResponse.data) {
                if (hasRasterProperties(apiResponse.data)) {
                  rasterData = apiResponse.data;
                } else if (typeof apiResponse.data === "string") {
                  rasterData = apiResponse.data;
                }
              } else if (apiResponse.result) {
                if (hasRasterProperties(apiResponse.result)) {
                  rasterData = apiResponse.result;
                } else if (typeof apiResponse.result === "string") {
                  rasterData = apiResponse.result;
                }
              } else if (apiResponse.response) {
                if (hasRasterProperties(apiResponse.response)) {
                  rasterData = apiResponse.response;
                } else if (typeof apiResponse.response === "string") {
                  rasterData = apiResponse.response;
                }
              } else {
                rasterData = findRasterData(apiResponse);

                if (!rasterData) {
                  // Try using original raster as fallback
                  rasterData = originalRaster;
                  setError(
                    "API response structure not recognized. Using original raster as fallback."
                  );
                }
              }

              if (rasterData) {
                // Store the API response data for download purposes
                if (typeof rasterData === "string") {
                  setApiResponseDownloadData(rasterData);
                } else if (
                  rasterData &&
                  typeof rasterData === "object" &&
                  rasterData.data &&
                  typeof rasterData.data === "string"
                ) {
                  setApiResponseDownloadData(rasterData.data);
                } else if (
                  rasterData &&
                  typeof rasterData === "object" &&
                  rasterData.result &&
                  typeof rasterData.result === "string"
                ) {
                  setApiResponseDownloadData(rasterData.result);
                } else if (
                  rasterData &&
                  typeof rasterData === "object" &&
                  rasterData.response &&
                  typeof rasterData.response === "string"
                ) {
                  setApiResponseDownloadData(rasterData.response);
                }

                const apiRasterLayer = await fetchApiResponse(
                  rasterData,
                  originalRasterArrayBuffer || undefined,
                  (data) => setDiagnosticData(data)
                );

                if (
                  rightMapInstance.current &&
                  apiRasterLayer &&
                  originalRasterBounds &&
                  originalRasterBounds.isValid()
                ) {
                  // Add the API response layer to the right map
                  apiRasterLayer.addTo(rightMapInstance.current);
                  rightLayerRef.current = apiRasterLayer; // Store ref to layer

                  // Ensure the API response layer is always on top of all overlay layers
                  setTimeout(() => {
                    bringApiResponseLayerToTop();
                  }, 100);

                  // Add red rectangle overlay to mark the "after" area
                  const redRectangle =
                    createRasterBoundsOverlay(originalRasterBounds);
                  redRectangle.addTo(rightMapInstance.current);

                  // Add a mask to hide the API response outside the bounds
                  // Create mask polygons: a rectangle covering the whole map, with a hole for our raster
                  const bounds = rightMapInstance.current.getBounds();
                  const outerRing = [
                    bounds.getNorthWest(),
                    bounds.getNorthEast(),
                    bounds.getSouthEast(),
                    bounds.getSouthWest(),
                  ];

                  // Create the hole (our raster area)
                  const innerRing = [
                    originalRasterBounds.getNorthWest(),
                    originalRasterBounds.getNorthEast(),
                    originalRasterBounds.getSouthEast(),
                    originalRasterBounds.getSouthWest(),
                  ];

                  // Create a polygon with a hole
                  const maskPolygon = L.polygon([outerRing, innerRing], {
                    color: "transparent",
                    fillColor: "white",
                    fillOpacity: 0.6,
                    interactive: false,
                  });

                  // Add the mask to the map above the API response layer
                  maskPolygon.addTo(rightMapInstance.current);
                } else {
                  setError("Failed to add API response raster to map");
                }
              } else {
                setError(
                  "API response does not contain valid raster data structure."
                );
              }
            } catch (apiError: any) {
              // Emergency fallback
              try {
                const fallbackLayer = await fetchApiResponse(
                  originalRaster,
                  originalRasterArrayBuffer || undefined,
                  (data) => setDiagnosticData(data)
                );
                if (rightMapInstance.current && fallbackLayer) {
                  fallbackLayer.addTo(rightMapInstance.current);
                  setError(
                    "API response failed to load. Showing original raster as fallback."
                  );
                } else {
                  setError(
                    `Error displaying API response: ${apiError.message}. Emergency fallback also failed.`
                  );
                }
              } catch (fallbackError: any) {
                setError(
                  `Error displaying API response: ${apiError.message}. Emergency fallback also failed: ${fallbackError.message}`
                );
              }
            }
          } else {
            setError(
              "No API response data provided. Please ensure data is passed from the previous page."
            );
          }

          setIsLoading(false);
        } catch (mapError: any) {
          setError(`Error creating maps: ${mapError.message}`);
          setIsLoading(false);
        }
      };

      await initializeMaps();
    };

    initializeData();
  }, [(location as any).state]);

  // Cleanup effect
  useEffect(() => {
    const handleResize = () => {
      if (connectivityMapInstance.current) {
        connectivityMapInstance.current.invalidateSize();
      }
      if (rightMapInstance.current) {
        rightMapInstance.current.invalidateSize();
      }
      if (overlayMapInstance.current) {
        overlayMapInstance.current.invalidateSize();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);

      // Clear any pending sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      // Clean up additional layers from all maps
      if (
        connectivityMapInstance.current &&
        additionalLayersRef.current.satellite.connectivity
      ) {
        try {
          connectivityMapInstance.current.removeLayer(
            additionalLayersRef.current.satellite.connectivity
          );
        } catch (e) {
          // Ignore errors if layer is not on this map
        }
      }
      if (
        rightMapInstance.current &&
        additionalLayersRef.current.satellite.right
      ) {
        try {
          rightMapInstance.current.removeLayer(
            additionalLayersRef.current.satellite.right
          );
        } catch (e) {
          // Ignore errors if layer is not on this map
        }
      }
      if (
        overlayMapInstance.current &&
        additionalLayersRef.current.satellite.overlay
      ) {
        try {
          overlayMapInstance.current.removeLayer(
            additionalLayersRef.current.satellite.overlay
          );
        } catch (e) {
          // Ignore errors if layer is not on this map
        }
      }

      // Reset all layer references
      additionalLayersRef.current = {
        roads: {},
        satellite: {},
        natura2000: {},
        enpe: {},
        pein: {},
        aquaticProtected: {},
        riversWaterBodies: {},
      };

      if (connectivityMapInstance.current) {
        connectivityMapInstance.current.remove();
        connectivityMapInstance.current = null;
      }

      if (rightMapInstance.current) {
        rightMapInstance.current.remove();
        rightMapInstance.current = null;
      }

      if (overlayMapInstance.current) {
        overlayMapInstance.current.remove();
        overlayMapInstance.current = null;
      }
    };
  }, []);

  // Legend component
  const LegendComponent = ({
    layerOption,
  }: {
    layerOption: "connectivity" | "muscsc";
  }) => {
    if (layerOption === "muscsc") {
      const muscscItems = [
        { value: 1, color: "rgb(153, 247, 245)", label: "Aquatic" },
        { value: 2, color: "rgb(164, 0, 0)", label: "Built area" },
        { value: 3, color: "rgb(255, 255, 140)", label: "Herbaceous cropland" },
        { value: 4, color: "rgb(255, 200, 145)", label: "Woody cropland" },
        {
          value: 5,
          color: "rgb(145, 134, 0)",
          label: "Shrubland and grassland",
        },
        { value: 6, color: "rgb(0, 132, 0)", label: "Forestland" },
        {
          value: 7,
          color: "rgb(184, 201, 189)",
          label: "Bare/sparse vegetation",
        },
      ];

      return (
        <div
          style={{
            background: "transparent",
            padding: "16px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            MUCSC Land Cover Classification
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              width: "100%",
            }}
          >
            {muscscItems.map((item) => (
              <div
                key={item.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "18px",
                    backgroundColor: item.color,
                    marginRight: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: "13px", color: "#333", lineHeight: "1.3" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              marginTop: "12px",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Multi-Use Land Cover and Land Use Classification System
          </div>
        </div>
      );
    } else {
      // Connectivity index legend - create a gradient using actual colorRamp colors
      const createConnectivityGradient = () => {
        const keyPoints = [
          colorRamp["0"], // 0
          colorRamp["25"], // 0.25
          colorRamp["51"], // 0.5
          colorRamp["77"], // 0.75
          colorRamp["102"], // 1.0
          colorRamp["127"], // 1.25
          colorRamp["153"], // 1.5
          colorRamp["178"], // 1.75
          colorRamp["204"], // 2.0
          colorRamp["229"], // 2.25
          colorRamp["255"], // 2.5
        ];

        return `linear-gradient(to right, ${keyPoints.join(", ")})`;
      };

      return (
        <div
          style={{
            background: "transparent",
            padding: "16px",
            marginBottom: "16px",
            width: "100%",
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Connectivity Index Legend
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Longer gradient bar using actual colorRamp - spans full width */}
            <div
              style={{
                width: "100%",
                height: "30px",
                background: createConnectivityGradient(),
                border: "1px solid #ccc",
                borderRadius: "4px",
                marginBottom: "12px",
              }}
            />
            {/* More detailed labels with more numbers */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              <span>0</span>
              <span>0.25</span>
              <span>0.5</span>
              <span>0.75</span>
              <span>1.0</span>
              <span>1.25</span>
              <span>1.5</span>
              <span>1.75</span>
              <span>2.0</span>
              <span>2.25</span>
              <span>2.5</span>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#666",
                marginTop: "8px",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Higher values indicate better ecological connectivity between
              forest areas
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <style>
        {`
          .protected-areas-collapse .ant-collapse-item {
            border: none !important;
          }
          .protected-areas-collapse .ant-collapse-header {
            padding: 4px 0 4px 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
            line-height: 1.5715 !important;
            display: flex !important;
            align-items: center !important;
          }
          .protected-areas-collapse .ant-collapse-arrow {
            position: static !important;
            margin-right: 8px !important;
            line-height: 1 !important;
          }
          .protected-areas-collapse .ant-collapse-content {
            border: none !important;
            background: transparent !important;
          }
          .protected-areas-collapse .ant-collapse-content-box {
            padding: 0 !important;
            padding-top: 8px !important;
          }
        `}
      </style>
      <Row style={{ width: "100%", height: "100px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-bioconn-widget"
          config={""}
        />
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
        <Row style={{ width: "100%", display: "flex" }}>
          {/* Left Panel - Controls (30% width) */}
          <div style={{ width: "30%", padding: "16px" }}>
            {/* Scenario Comparison Heading */}
            <h2>Scenario Comparison</h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>
              Compare connectivity index and newly calculated connectivity index
              data
            </p>

            {/* Species Section - Matching BioConn exactly - MOVED TO TOP */}
            <div style={{ marginBottom: "24px" }}>
              <h3>Species</h3>
              <Radio.Group
                value={speciesOption}
                onChange={handleSpeciesChange}
                style={{ marginBottom: "16px" }}
              >
                <Radio value="all">All species</Radio>
                <Radio value="specific">Specific species</Radio>
              </Radio.Group>

              {speciesOption === "specific" && (
                <div>
                  <Input.Search
                    placeholder="Search for species..."
                    value={gbifQuery}
                    onChange={(e) => {
                      setGbifQuery(e.target.value);
                      if (e.target.value.length > 2) {
                        searchGbifSpecies(e.target.value);
                      } else {
                        setGbifSuggestions([]);
                      }
                    }}
                    style={{ marginBottom: "8px" }}
                    loading={isLoading}
                  />

                  {gbifSuggestions.length > 0 && (
                    <Select
                      style={{ width: "100%", marginBottom: "8px" }}
                      placeholder="Select a species"
                      onChange={(taxonKey: number) => {
                        const selected = gbifSuggestions.find(
                          (s) => s.key === taxonKey
                        );
                        if (selected) {
                          setSelectedTaxonKey(taxonKey);
                          setGbifQuery(selected.scientificName);
                          setGbifSuggestions([]);
                        }
                      }}
                      value={selectedTaxonKey}
                    >
                      {gbifSuggestions.map((species) => (
                        <Option key={species.key} value={species.key}>
                          <div>
                            <strong>{species.scientificName}</strong>
                            {species.commonName && (
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {species.commonName}
                              </div>
                            )}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  )}

                  {selectedTaxonKey && (
                    <div style={{ marginTop: "8px" }}>
                      <Button
                        type="primary"
                        onClick={fetchGbifOccurrences}
                        loading={isLoading}
                        style={{ marginRight: "8px" }}
                      >
                        Load Occurrences
                      </Button>
                      <Button onClick={resetSpeciesSelection}>Clear</Button>
                      {occurrenceData.length > 0 && (
                        <p style={{ marginTop: "8px", fontSize: "12px" }}>
                          {occurrenceData.length} occurrences loaded
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Layer Controls Section - Matching BioConn exactly */}
            <div style={{ marginBottom: "24px" }}>
              <h3>Layers</h3>

              {/* BioConn-style layer checkboxes */}
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
                  checked={checkboxOptions.riversWaterBodies}
                  onChange={() => handleCheckboxChange("riversWaterBodies")}
                >
                  Rivers and Water Bodies
                </Checkbox>
                <br />
                <Checkbox
                  checked={checkboxOptions.cadastral}
                  onChange={() => handleCheckboxChange("cadastral")}
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
                  className="protected-areas-collapse"
                >
                  <Panel
                    header="Protected Areas"
                    key="1"
                    style={{ padding: 0 }}
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
                        onChange={() =>
                          handleCheckboxChange("aquaticProtected")
                        }
                      >
                        Aquatic Protected Areas
                      </Checkbox>
                    </div>
                  </Panel>
                </Collapse>
              </div>
            </div>
          </div>

          {/* Right Column - Maps (70% width) */}
          <div style={{ width: "70%", padding: "16px", position: "relative" }}>
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: "20px" }}
              />
            )}

            {/* Loading overlay positioned over the map area */}
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  padding: "20px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Spin size="large" />
                <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                  Loading maps...
                </p>
              </div>
            )}

            {mapView === "side-by-side" ? (
              // Side by Side View
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  gap: "15px",
                }}
              >
                {/* Left Map - Connectivity Index */}
                {showConnectivityIndex && (
                  <div
                    style={{
                      width: showApiResponse ? "50%" : "100%",
                      position: "relative",
                    }}
                  >
                    <h3 style={{ marginBottom: "10px" }}>Connectivity Index</h3>
                    <div
                      ref={connectivityMapContainerRef}
                      style={{
                        height: "500px",
                        width: "100%",
                        border: "2px solid #ccc",
                        backgroundColor: "#f0f0f0",
                        display: "block",
                        position: "relative",
                      }}
                    />
                  </div>
                )}

                {/* Right Map - API Response */}
                {showApiResponse && (
                  <div
                    style={{
                      width: showConnectivityIndex ? "50%" : "100%",
                      position: "relative",
                    }}
                  >
                    <h3 style={{ marginBottom: "10px" }}>
                      Calculated Connectivity Index
                    </h3>
                    <div
                      ref={rightMapContainerRef}
                      style={{
                        height: "500px",
                        width: "100%",
                        border: "2px solid #ccc",
                        backgroundColor: "#f0f0f0",
                        display: "block",
                        position: "relative",
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Overlay View (if needed in future)
              <div style={{ width: "100%" }}>
                <h3 style={{ marginBottom: "10px" }}>Overlay Comparison</h3>
                <div
                  ref={overlayMapRef}
                  style={{
                    height: "500px",
                    width: "100%",
                    border: "2px solid #ccc",
                    backgroundColor: "#f0f0f0",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Legend Section - Below Maps */}
            <div style={{ marginTop: "24px" }}>
              <LegendComponent layerOption={layerOption} />
            </div>
          </div>
        </Row>
      </ConfigProvider>
    </>
  );
};

export default CompareScenario;
