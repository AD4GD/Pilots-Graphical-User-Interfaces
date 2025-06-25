import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geoblaze from "geoblaze";
import { Row, ConfigProvider, Alert, Spin, Button } from "antd";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useLocation, useNavigate } from "@opendash/router";
import * as GeoTIFF from "geotiff";
import Parse from "parse";
import colorRamp from "./colorRamp.json";
import {
  analyzeGeoTiff,
  base64ToArrayBuffer,
  compareGeoTiffAnalyses,
  createFallbackGeoraster,
  type GeoTiffAnalysis,
} from "../bioConn/geoTiffAnalysis";
import DiagnosticDisplay from "../bioConn/DiagnosticDisplay";

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

// Utility function to download base64 data as a file
const downloadBase64AsFile = (
  base64Data: string,
  filename: string,
  contentType: string = "image/tiff"
) => {
  const arrayBuffer = base64ToArrayBuffer(base64Data);
  downloadArrayBufferAsFile(arrayBuffer, filename, contentType);
};

// Function to create a simple GeoTIFF-like ArrayBuffer from raster data
const createGeoTiffFromRasterData = async (
  rasterData: any
): Promise<ArrayBuffer> => {
  try {
    // This is a simplified approach - create a JSON representation
    // In a production environment, you'd want to use a proper GeoTIFF library
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

// Function to fetch connectivity index (similar to bioConn.tsx)
const fetchConnectivityIndex = async () => {
  try {
    // Call the Parse Cloud Function for connectivity
    const result = await Parse.Cloud.run("getConnectivity", {
      time: "2017-01-01T00:00:00.000Z", // Default to 2017
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

    console.log("🔄 Converting base64 to raster object...");

    // Convert base64 to raster object (same structure as original raster)
    const rasterObject = await convertBase64ToRasterObject(base64Data);

    console.log("✅ Base64 converted to raster object successfully"); // Optional: Still do diagnostic analysis if requested
    if (originalRasterArrayBuffer && storeDiagnosticData) {
      try {
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        const apiAnalysis = await analyzeGeoTiff(arrayBuffer);
        const originalAnalysis = await analyzeGeoTiff(
          originalRasterArrayBuffer
        );
        const comparisonResults = compareGeoTiffAnalyses(
          originalAnalysis,
          apiAnalysis
        );

        storeDiagnosticData({
          originalAnalysis,
          apiAnalysis,
          comparisonResults,
        });
      } catch (diagError) {
        console.warn("Diagnostic analysis failed:", diagError);
      }
    }

    console.log("🔄 Converting to geoblaze raster format...");
    // First convert the raster object to a geoblaze-compatible format (same as original raster)
    const geoblazeRaster = await convertToGeoblazeRaster(rasterObject);

    // Then use the connectivity color mapping for the raster layer (same as leftmost map)
    console.log("🔄 Creating raster layer with connectivity colors...");
    const rasterLayer = await createConnectivityRaster(geoblazeRaster);

    console.log(
      "✅ API response processed successfully with connectivity colors"
    );
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
  const leftMapInstance = useRef<L.Map | null>(null);
  const rightMapInstance = useRef<L.Map | null>(null);
  const connectivityMapContainerRef = useRef<HTMLDivElement | null>(null);
  const leftMapContainerRef = useRef<HTMLDivElement | null>(null);
  const rightMapContainerRef = useRef<HTMLDivElement | null>(null);

  // Add refs to track layer loading states and sync timeout
  const connectivityLayerRef = useRef<any>(null);
  const leftLayerRef = useRef<any>(null);
  const rightLayerRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [diagnosticData, setDiagnosticData] = useState<{
    originalAnalysis?: GeoTiffAnalysis;
    apiAnalysis?: GeoTiffAnalysis;
    comparisonResults?: { differences: string[]; criticalIssues: string[] };
  }>({});
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  // State to store download data
  const [originalRasterDownloadData, setOriginalRasterDownloadData] =
    useState<ArrayBuffer | null>(null);
  const [isOriginalRasterFromFile, setIsOriginalRasterFromFile] =
    useState<boolean>(false);
  const [apiResponseDownloadData, setApiResponseDownloadData] = useState<
    string | null
  >(null);

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

  // Single effect that handles both data validation and map initialization
  useEffect(() => {
    const initializeData = async () => {
      const { originalRaster, apiResponse } = (location as any).state || {};

      console.log("apiResponse", apiResponse);

      if (!originalRaster) {
        setError("Missing original raster data. Please go back and try again.");
        setIsLoading(false);
        return;
      } // Process original raster using the convertToGeoblazeRaster function
      let parsedOriginalRaster;
      let originalRasterArrayBuffer: ArrayBuffer | null = null;

      try {
        parsedOriginalRaster = await convertToGeoblazeRaster(originalRaster); // Check for downloadable GeoTIFF from bioConnScenario first
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
        } // Store the ArrayBuffer for download purposes
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

          // Create all three maps with the same center and zoom
          connectivityMapInstance.current = L.map(
            connectivityMapContainerRef.current!
          ).setView([41.7, 1.7], 7);
          leftMapInstance.current = L.map(leftMapContainerRef.current!).setView(
            [41.7, 1.7],
            7
          );
          rightMapInstance.current = L.map(
            rightMapContainerRef.current!
          ).setView([41.7, 1.7], 7);

          // Force maps to invalidate size after creation
          setTimeout(() => {
            if (
              connectivityMapInstance.current &&
              leftMapInstance.current &&
              rightMapInstance.current
            ) {
              connectivityMapInstance.current.invalidateSize();
              leftMapInstance.current.invalidateSize();
              rightMapInstance.current.invalidateSize();
            }
          }, 100);

          // Add tile layers to all maps
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(connectivityMapInstance.current);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(leftMapInstance.current);

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

          // Add original raster layer to center map
          try {
            const originalRasterLayer = await createRaster(
              parsedOriginalRaster,
              0.8
            );
            if (leftMapInstance.current) {
              originalRasterLayer.addTo(leftMapInstance.current);
              leftLayerRef.current = originalRasterLayer; // Store ref to layer

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

              // Fit all maps to the raster bounds
              try {
                if (originalRasterBounds && originalRasterBounds.isValid()) {
                  connectivityMapInstance.current?.fitBounds(
                    originalRasterBounds
                  );
                  leftMapInstance.current.fitBounds(originalRasterBounds);
                  rightMapInstance.current?.fitBounds(originalRasterBounds);
                }
              } catch (boundsError) {
                // Silently handle bounds fitting errors
              }
            }
          } catch (rasterError: any) {
            setError(
              `Error displaying original raster: ${rasterError.message}`
            );
          } // Sync all three maps' zoom and pan using debounced function
          connectivityMapInstance.current.on("move", () => {
            if (connectivityMapInstance.current) {
              debouncedSync(connectivityMapInstance.current, [
                leftMapInstance.current!,
                rightMapInstance.current!,
              ]);
            }
          });

          leftMapInstance.current.on("move", () => {
            if (leftMapInstance.current) {
              debouncedSync(leftMapInstance.current, [
                connectivityMapInstance.current!,
                rightMapInstance.current!,
              ]);
            }
          });

          rightMapInstance.current.on("move", () => {
            if (rightMapInstance.current) {
              debouncedSync(rightMapInstance.current, [
                connectivityMapInstance.current!,
                leftMapInstance.current!,
              ]);
            }
          }); // Process API response data and display on right map
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
                  // Note: We don't overwrite rightLayerRef here since it should track the API response layer
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

                  // Add a red rectangle to mark the "after" area
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
      if (leftMapInstance.current) {
        leftMapInstance.current.invalidateSize();
      }
      if (rightMapInstance.current) {
        rightMapInstance.current.invalidateSize();
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

      if (connectivityMapInstance.current) {
        connectivityMapInstance.current.remove();
        connectivityMapInstance.current = null;
      }

      if (leftMapInstance.current) {
        leftMapInstance.current.remove();
        leftMapInstance.current = null;
      }

      if (rightMapInstance.current) {
        rightMapInstance.current.remove();
        rightMapInstance.current = null;
      }
    };
  }, []);

  return (
    <>
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
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "20px auto",
            padding: "20px",
          }}
        >
          {" "}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2>Scenario Comparison</h2>
              <p>
                Comparing connectivity index, original raster, and API response
              </p>
            </div>{" "}
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                type="primary"
                onClick={() => navigate("/bioconnect/scenario")}
              >
                Create New Scenario
              </Button>
            </div>
          </div>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: "20px" }}
            />
          )}
          {isLoading && (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <Spin size="large" />
              <p style={{ marginTop: "20px" }}>Loading maps...</p>
            </div>
          )}{" "}
          <div
            style={{
              display: "flex",
              width: "100%",
              marginBottom: "20px",
              gap: "15px",
            }}
          >
            {" "}
            {/* Left Map - Connectivity Index */}
            <div style={{ width: "50%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0 }}>Connectivity Index</h3>
                <Button
                  size="small"
                  type="text"
                  onClick={() => {
                    if (originalRasterDownloadData) {
                      const timestamp = new Date()
                        .toISOString()
                        .replace(/[:.]/g, "-");
                      const filename = `original_raster_${timestamp}.tiff`;
                      downloadArrayBufferAsFile(
                        originalRasterDownloadData,
                        filename,
                        "image/tiff"
                      );
                    } else {
                      alert("Original raster data not available for download");
                    }
                  }}
                  disabled={!originalRasterDownloadData}
                  title="Download Original Raster"
                >
                  📥
                </Button>
              </div>
              <div
                ref={connectivityMapContainerRef}
                style={{
                  height: "400px",
                  width: "100%",
                  border: "2px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  display: "block",
                }}
              />
            </div>
            {/* Hidden Middle Map - Still needed for red rectangle calculation */}
            <div style={{ display: "none" }}>
              <div
                ref={leftMapContainerRef}
                style={{
                  height: "400px",
                  width: "100%",
                  border: "2px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  display: "block",
                }}
              />
            </div>
            {/* Right Map - API Response */}
            <div style={{ width: "50%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0 }}>API Response</h3>
                <Button
                  size="small"
                  type="text"
                  onClick={() => {
                    if (apiResponseDownloadData) {
                      const timestamp = new Date()
                        .toISOString()
                        .replace(/[:.]/g, "-");
                      downloadBase64AsFile(
                        apiResponseDownloadData,
                        `api_response_${timestamp}.tiff`
                      );
                    } else {
                      alert("API response data not available for download");
                    }
                  }}
                  disabled={!apiResponseDownloadData}
                  title="Download API Response"
                >
                  📥
                </Button>
              </div>
              <div
                ref={rightMapContainerRef}
                style={{
                  height: "400px",
                  width: "100%",
                  border: "2px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
};

export default CompareScenario;
