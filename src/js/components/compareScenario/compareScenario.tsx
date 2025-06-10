import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geoblaze from "geoblaze";
import { Row, ConfigProvider, Alert, Spin, Button } from "antd";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useLocation, useNavigate } from "@opendash/router";
import * as GeoTIFF from "geotiff";

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
  // console.log("=== Converting custom raster to geoblaze format ===");

  // If the raster already has geoblaze properties (like _url), it's already parsed
  if (
    customRaster._url ||
    customRaster.georasterPromise ||
    customRaster.metadata?.width
  ) {
    // console.log("Raster appears to be already geoblaze-parsed");
    return customRaster;
  }

  try {
    // console.log("Validating raster structure...");

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
        // console.error(`Missing required property: ${prop}`);
        // console.log("Available properties:", Object.keys(customRaster));
        throw new Error(`Missing required property: ${prop}`);
      }
    }

    // console.log("Raster validation passed");

    // Extract values and ensure proper structure
    let values;

    // Handle different array structures
    if (Array.isArray(customRaster.values)) {
      // Check if values is already a 3D array [band][row][col]
      if (
        Array.isArray(customRaster.values[0]) &&
        Array.isArray(customRaster.values[0][0])
      ) {
        // console.log("Values already in 3D format [band][row][col]");
        values = customRaster.values;
      }
      // Check if values is a 2D array [row][col]
      else if (Array.isArray(customRaster.values[0])) {
        // console.log("Values in 2D format [row][col], converting to 3D");
        values = [customRaster.values]; // Wrap in array to make it 3D [band][row][col]
      }
      // Otherwise, assume it's a 1D array that needs reshaping
      else {
        // console.log("Values in 1D format, reshaping to 3D");
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
      console.error("Values is not an array:", typeof customRaster.values);
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

    // console.log("=== Successfully converted to geoblaze format ===");

    return georaster;
  } catch (error: any) {
    // console.error("=== Error converting custom raster to geoblaze format ===");
    // console.error("Error details:", error);
    // console.error("Error stack:", error.stack);
    throw new Error(`Failed to convert raster: ${error.message}`);
  }
};

const createRaster = async (rasterData: any, opacity: number = 0.7) => {
  // console.log("=== Creating raster layer ===");

  try {
    let georaster;

    // Check if this is already a parsed georaster or if we need to convert it
    if (
      rasterData._url ||
      rasterData.georasterPromise ||
      rasterData.metadata?.width
    ) {
      georaster = rasterData;
      console.log("Raster is already in geoblaze format, using directly");
    } else {
      console.log("Raster is not in geoblaze format, converting...");
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

// Function to convert API response base64 data to raster layer (similar to fetchImage from bioConnScenario)
const fetchApiResponse = async (base64Data: string) => {
  try {
    console.log("=== fetchApiResponse: Starting API response processing ===");
    console.log("Base64 data length:", base64Data.length);
    console.log("Base64 data (first 100 chars):", base64Data.substring(0, 100));
    console.log(
      "Base64 data (last 50 chars):",
      base64Data.substring(base64Data.length - 50)
    );

    // Convert base64 to ArrayBuffer (same pattern as fetchImage from bioConnScenario)
    console.log("Converting base64 to binary...");
    const binaryString = atob(base64Data);
    console.log("Binary string length:", binaryString.length);

    const arrayBuffer = new ArrayBuffer(binaryString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < binaryString.length; i++) {
      uintArray[i] = binaryString.charCodeAt(i);
    }

    // Enhanced TIFF header validation
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 10));
    const headerHex = Array.from(headerBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    console.log("File header (first 10 bytes as hex):", headerHex);

    // TIFF magic numbers: 49492a00 (little-endian II*) or 4d4d002a (big-endian MM*)
    const isLittleEndianTiff = headerHex.startsWith("49492a00");
    const isBigEndianTiff = headerHex.startsWith("4d4d002a");
    const isValidTiff = isLittleEndianTiff || isBigEndianTiff;

    console.log("TIFF validation:");
    console.log("  Little-endian TIFF (II*):", isLittleEndianTiff);
    console.log("  Big-endian TIFF (MM*):", isBigEndianTiff);
    console.log("  Is valid TIFF:", isValidTiff);

    if (!isValidTiff) {
      console.warn("⚠️ Data does not have valid TIFF magic bytes");

      // Try to decode as text to see if it's an error message
      try {
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        const textContent = textDecoder.decode(
          arrayBuffer.slice(0, Math.min(500, arrayBuffer.byteLength))
        );
        console.log("Content decoded as text (first 500 chars):", textContent);

        // Check if this looks like an error response
        if (
          textContent.includes("error") ||
          textContent.includes("Error") ||
          textContent.includes("failed")
        ) {
          throw new Error(`API returned error response: ${textContent}`);
        }
      } catch (textError) {
        console.log("Could not decode as UTF-8 text:", textError);
      }

      // Continue with parsing anyway - might be a valid GeoTIFF with different structure
      console.log(
        "Continuing with parsing despite invalid TIFF header..."
      );
    }

    // First try using geotiff library to validate and extract basic info
    let georaster;
    try {
      console.log("🔄 Step 1: Trying geotiff library validation...");
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      
      console.log("✅ GeoTIFF library parsed successfully!");
      console.log("GeoTIFF image properties:", {
        width: image.getWidth(),
        height: image.getHeight(),
        samplesPerPixel: image.getSamplesPerPixel(),
        bitsPerSample: image.getBitsPerSample(),
        origin: image.getOrigin(),
        resolution: image.getResolution(),
        bbox: image.getBoundingBox()
      });

      // Now try geoblaze parsing with the validated ArrayBuffer
      console.log("🔄 Step 2: Using geoblaze.parse() on validated TIFF...");
      georaster = await geoblaze.parse(arrayBuffer);
      
    } catch (geotiffError: any) {
      console.warn("⚠️ GeoTIFF library validation failed:", geotiffError.message);
      
      // Fallback to direct geoblaze parsing
      console.log("🔄 Step 2 (Fallback): Direct geoblaze.parse() attempt...");
      georaster = await geoblaze.parse(arrayBuffer);
    }

    console.log("✅ API response georaster parsed successfully!");
    console.log("Georaster properties:", {
      width: georaster.width,
      height: georaster.height,
      numberOfRasters: georaster.numberOfRasters,
      projection: georaster.projection,
      xmin: georaster.xmin,
      ymin: georaster.ymin,
      xmax: georaster.xmax,
      ymax: georaster.ymax,
    });

    // Create and return the raster layer
    const rasterLayer = await createRaster(georaster, 0.8);
    console.log("✅ Raster layer created successfully");

    return rasterLayer;
  } catch (error: any) {
    console.error("❌ Error in fetchApiResponse:");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);

    // Try to provide more specific error information
    if (error.message && error.message.includes("metadata")) {
      console.error("This appears to be a geoblaze metadata parsing error");
      console.error("Possible causes:");
      console.error("1. Invalid or corrupted TIFF data");
      console.error("2. Unsupported TIFF variant");
      console.error("3. Missing required TIFF tags");

      // Try alternative parsing approach - recreate arrayBuffer in this scope
      console.log("🔄 Attempting fallback parsing with URL approach...");
      let blobUrl: string | undefined;
      try {
        // Recreate the arrayBuffer since it's not in scope here
        const binaryString = atob(base64Data);
        const fallbackArrayBuffer = new ArrayBuffer(binaryString.length);
        const fallbackUintArray = new Uint8Array(fallbackArrayBuffer);

        for (let i = 0; i < binaryString.length; i++) {
          fallbackUintArray[i] = binaryString.charCodeAt(i);
        }

        // Create a blob URL and try parsing with that
        const blob = new Blob([fallbackArrayBuffer], { type: "image/tiff" });
        blobUrl = URL.createObjectURL(blob);

        console.log("Created blob URL for fallback parsing:", blobUrl);
        const georasterFromUrl = await geoblaze.parse(blobUrl);

        console.log("✅ Fallback parsing successful!");
        console.log("Fallback georaster properties:", {
          width: georasterFromUrl.width,
          height: georasterFromUrl.height,
          numberOfRasters: georasterFromUrl.numberOfRasters,
        });

        const fallbackRasterLayer = await createRaster(georasterFromUrl, 0.8);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);

        return fallbackRasterLayer;
      } catch (fallbackError: any) {
        console.error("❌ Fallback parsing also failed:", fallbackError);
        // Clean up the blob URL if it was created
        if (blobUrl) {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch (cleanupError) {
            console.log("Could not clean up blob URL:", cleanupError);
          }
        }
      }
    }

    throw new Error(`Failed to process API response: ${error.message}`);
  }
};

const CompareScenario: React.FC<CompareScenarioProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const leftMapInstance = useRef<L.Map | null>(null);
  const rightMapInstance = useRef<L.Map | null>(null);
  const leftMapContainerRef = useRef<HTMLDivElement | null>(null);
  const rightMapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>(""); // Single effect that handles both data validation and map initialization
  useEffect(() => {
    const initializeData = async () => {
      const { originalRaster, apiResponse } = location.state || {};

      console.log("Location state:", location.state);
      // console.log("Original raster data:", originalRaster);

      if (!originalRaster) {
        setError("Missing original raster data. Please go back and try again.");
        setIsLoading(false);
        return;
      }

      // Process original raster using the convertToGeoblazeRaster function
      let parsedOriginalRaster;
      try {
        // console.log(
        //   "Processing original raster with convertToGeoblazeRaster..."
        // );
        parsedOriginalRaster = await convertToGeoblazeRaster(originalRaster);
        // console.log("Processed original raster successfully");
      } catch (error: any) {
        // console.error("Error processing original raster:", error);
        setError(`Error processing original raster: ${error.message}`);
        setIsLoading(false);
        return;
      }

      // Don't initialize if containers are not ready or maps already exist
      if (!leftMapContainerRef.current || !rightMapContainerRef.current) {
        // console.log("Map containers not ready, waiting...");
        return;
      }

      if (leftMapInstance.current || rightMapInstance.current) {
        // console.log("Maps already exist, skipping initialization");
        return;
      }

      // console.log("Map containers ready, proceeding with initialization");

      const initializeMaps = async () => {
        try {
          // console.log("Initializing maps...");

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

          // Create both maps with the same center and zoom
          leftMapInstance.current = L.map(leftMapContainerRef.current!).setView(
            [41.7, 1.7],
            7
          );
          rightMapInstance.current = L.map(
            rightMapContainerRef.current!
          ).setView([41.7, 1.7], 7);

          // console.log("Maps created successfully");

          // Force maps to invalidate size after creation
          setTimeout(() => {
            if (leftMapInstance.current && rightMapInstance.current) {
              leftMapInstance.current.invalidateSize();
              rightMapInstance.current.invalidateSize();
              // console.log("Map sizes invalidated");
            }
          }, 100);

          // Add tile layers to both maps
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(leftMapInstance.current);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(rightMapInstance.current);

          // Add original raster layer to left map only
          try {
            const originalRasterLayer = await createRaster(
              parsedOriginalRaster,
              0.8
            );

            if (leftMapInstance.current) {
              originalRasterLayer.addTo(leftMapInstance.current);

              // Fit both maps to the raster bounds
              try {
                const bounds = originalRasterLayer.getBounds();
                if (bounds && bounds.isValid()) {
                  leftMapInstance.current.fitBounds(bounds);
                  rightMapInstance.current?.fitBounds(bounds);
                } else {
                  console.warn("Could not get valid bounds from raster layer");
                }
              } catch (boundsError) {
                console.warn(
                  "Could not fit bounds, using default view:",
                  boundsError
                );
              }
            } else {
              console.error(
                "Left map instance is null when trying to add raster layer"
              );
            }
          } catch (rasterError: any) {
            console.error("Error creating original raster layer:", rasterError);
            setError(
              `Error displaying original raster: ${rasterError.message}`
            );
          }

          // Sync maps' zoom and pan
          leftMapInstance.current.on("move", () => {
            if (leftMapInstance.current && rightMapInstance.current) {
              rightMapInstance.current.setView(
                leftMapInstance.current.getCenter(),
                leftMapInstance.current.getZoom(),
                { animate: false }
              );
            }
          });
          rightMapInstance.current.on("move", () => {
            if (leftMapInstance.current && rightMapInstance.current) {
              leftMapInstance.current.setView(
                rightMapInstance.current.getCenter(),
                rightMapInstance.current.getZoom(),
                { animate: false }
              );
            }
          });

          // Process API response data and display on right map
          if (apiResponse && apiResponse.data) {
            try {
              console.log("Processing API response data for right map...");
              const apiRasterLayer = await fetchApiResponse(apiResponse.data);

              if (rightMapInstance.current && apiRasterLayer) {
                apiRasterLayer.addTo(rightMapInstance.current);
                console.log("API response raster added to right map");
              }
            } catch (apiError: any) {
              console.error("Error processing API response:", apiError);
              setError(`Error displaying API response: ${apiError.message}`);
            }
          }

          setIsLoading(false);
        } catch (mapError: any) {
          console.error("Error creating maps:", mapError);
          setError(`Error creating maps: ${mapError.message}`);
          setIsLoading(false);
        }
      };

      await initializeMaps();
    };

    initializeData();
  }, [location.state]);

  // Cleanup effect
  useEffect(() => {
    const handleResize = () => {
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
              <p>Comparing original raster with API response</p>
            </div>
            <Button
              type="primary"
              onClick={() => navigate("/bioconnect/scenario")}
            >
              Create New Scenario
            </Button>
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
          )}

          <div
            style={{
              display: "flex",
              width: "100%",
              marginBottom: "20px",
              gap: "20px",
            }}
          >
            {/* Left Map - Original Raster */}
            <div style={{ width: "50%" }}>
              <h3>Before</h3>
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

            {/* Right Map - Empty for now */}
            <div style={{ width: "50%" }}>
              <h3>After</h3>
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
