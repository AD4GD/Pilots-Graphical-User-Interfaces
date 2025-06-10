import React, { useState, useRef } from "react";
import {
  Upload,
  Button,
  Select,
  Row,
  ConfigProvider,
  Space,
  Card,
  message,
  Spin,
  Radio,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import geoblaze from "geoblaze";
import Parse from "parse";

const { Option } = Select;

// The API endpoint is now handled through Parse Cloud Functions
const API_INFO = {
  url: "https://pilot2api.dashboard-siba.store/bioconn/",
  cloudFunction: "processBioconnTiff",
};

const typeOptions = [
  { label: "Forest", value: "forest" },
  { label: "Woody", value: "woody" },
  { label: "Shrublands", value: "shrublands" },
  { label: "Herbaceous", value: "herbaceous" },
];

const modeOptions = [
  { label: "High", value: "high" },
  { label: "Low", value: "low" },
];

const interpolateColor = (value: number): string => {
  // Using a simple color scale for visualization
  const colors = [
    "rgba(0, 0, 0, 0)", // 0: Transparent
    "rgb(240, 249, 232)", // 1: Very light green
    "rgb(186, 228, 188)", // 2: Light green
    "rgb(123, 204, 196)", // 3: Teal
    "rgb(67, 162, 202)", // 4: Light blue
    "rgb(8, 104, 172)", // 5: Dark blue
  ];

  // Ensure the value is within the range of our color array
  const index = Math.max(0, Math.min(Math.floor(value), colors.length - 1));
  return colors[index];
};

const BioConnTest: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [type, setType] = useState("forest");
  const [mode, setMode] = useState("high");
  const [resultData, setResultData] = useState<any>(null);
  const [resultBlob, setResultBlob] = useState<string>("");
  const [error, setError] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const rasterLayer = useRef<any>(null);

  // Initialize the map
  React.useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a file first");
      return;
    }
    setUploading(true);
    setProcessing(true);
    setError("");
    setResultData(null);
    setResultBlob(""); // Set up a timeout to cancel the operation if it takes too long
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Operation timed out after 15 minutes. The server may be busy or the file may be too large."
          )
        );
      }, 1200000); // 20 minutes to match server-side timeout
    });

    try {
      // Read the file as an ArrayBuffer
      const file = fileList[0].originFileObj; // Validate that file is a valid File object
      if (!file || !(file instanceof File)) {
        throw new Error(
          "Invalid file object. Please try selecting the file again."
        );
      } // Add a warning for large files
      if (file.size > 10 * 1024 * 1024) {
        // If larger than 10MB
        message.warning(
          "This file is large and may take up to 15 minutes to process. Please be patient."
        );
      }
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const base64Data = arrayBufferToBase64(arrayBuffer);
      console.log(
        `File read successfully: ${formatBytes(
          arrayBuffer.byteLength
        )} converted to base64`
      );

      // Call the Parse Cloud Function with a timeout
      message.info({ content: "Sending data to server...", key: "processing" }); // Race the actual operation against the timeout
      const result = await Promise.race([
        Parse.Cloud.run(API_INFO.cloudFunction, {
          type: type,
          mode: mode,
          fileData: base64Data,
        }),
        timeoutPromise,
      ]);
      if (result.status !== "success" || !result.data) {
        throw new Error("Failed to process TIFF data");
      }

      // Store the base64 data for download
      setResultBlob(result.data);

      message.success({
        content: "Processing complete! Loading results...",
        key: "processing",
      });

      // Log additional metadata from server response
      console.log("Server response metadata:", {
        contentType: result.contentType || "image/tiff",
        fileSize: result.fileSize ? formatBytes(result.fileSize) : "Unknown",
        metadata: result.metadata || "No metadata received from server",
      });

      // Use server-provided metadata to help with parsing if available
      const serverMetadata = result.metadata || {};

      // Convert base64 back to ArrayBuffer
      const responseArrayBuffer = base64ToArrayBuffer(result.data);
      console.log(
        `Response received: ${formatBytes(responseArrayBuffer.byteLength)}`
      ); // Check if the response is actually a GeoTIFF
      const header = new Uint8Array(responseArrayBuffer.slice(0, 4));
      const headerHex = Array.from(header)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      console.log("File header (hex):", headerHex);

      // TIFF files typically start with "49 49 2A 00" (little-endian) or "4D 4D 00 2A" (big-endian)
      const isTiff = headerHex === "49492a00" || headerHex === "4d4d002a";
      console.log("Is valid TIFF format:", isTiff);

      if (!isTiff) {
        // Try to decode as text to see if it's an error message
        try {
          const textDecoder = new TextDecoder();
          const textContent = textDecoder.decode(responseArrayBuffer);
          console.log(
            "Response as text:",
            textContent.substring(0, 200) + "..."
          );
          throw new Error(
            "Response is not a valid GeoTIFF format. API may have returned an error response."
          );
        } catch (e) {
          console.error("Failed to decode response:", e);
          throw new Error(
            "Response is not a valid GeoTIFF format and could not be decoded as text."
          );
        }
      } // Parse the GeoTIFF response
      try {
        console.log("Parsing GeoTIFF...");

        // Pre-validation of GeoTIFF data before parsing
        const headerView = new DataView(responseArrayBuffer, 0, 16);
        console.log("GeoTIFF header inspection:", {
          byteLength: responseArrayBuffer.byteLength,
          firstBytes: Array.from(
            new Uint8Array(responseArrayBuffer.slice(0, 16))
          )
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
        });

        // We're using geoblaze v2.8.0 which depends on geotiff.js
        // Sometimes direct parsing fails if metadata is missing or corrupted
        // First, try to use the geotiff library directly to get more control
        const GeoTIFF = require("geotiff");
        console.log("Attempting to parse with GeoTIFF library directly...");
        try {
          // Explicitly import GeoTIFF from 'geotiff' package to ensure correct version
          const GeoTIFF = require("geotiff");
          console.log("Attempting to parse with GeoTIFF library directly...");

          // First, parse with GeoTIFF.js to get metadata
          const tiff = await GeoTIFF.fromArrayBuffer(responseArrayBuffer);
          const image = await tiff.getImage();
          const metadata = image.getFileDirectory();
          const fileValues = await image.readRasters();

          console.log("GeoTIFF metadata extracted successfully:", {
            imageWidth: metadata.ImageWidth,
            imageLength: metadata.ImageLength,
            hasTileInfo: !!metadata.TileWidth,
            hasBitsPerSample: !!metadata.BitsPerSample,
            hasSampleFormat: !!metadata.SampleFormat,
            geoKeys: metadata.GeoKeyDirectory ? "present" : "missing",
            fileValues: fileValues ? "data present" : "no data",
          });

          // Create our own raster object with required properties if geoblaze fails
          try {
            // First try the standard geoblaze approach
            const georaster = await geoblaze.parse(responseArrayBuffer);
            console.log("GeoTIFF parsed successfully with geoblaze:", {
              width: georaster.width,
              height: georaster.height,
              noDataValue: georaster.noDataValue,
              projection: georaster.projection,
              hasValueArray: !!georaster.values,
            });

            setResultData(georaster);
            displayRasterLayer(georaster);
          } catch (geoblazeError) {
            console.error(
              "Error with standard geoblaze parsing, trying fallback approach:",
              geoblazeError
            );

            // If standard parsing fails, manually create a georaster object
            // Get the raster data and geotransform
            const values = fileValues ? [fileValues[0]] : [];

            // Manual creation of georaster object with required structure
            const manualGeoraster = {
              values: values,
              noDataValue: metadata.GDAL_NODATA || 0,
              projection: metadata.GeoKeyDirectory ? "EPSG:4326" : undefined, // Default to WGS84
              pixelWidth: metadata.ModelPixelScaleTag
                ? metadata.ModelPixelScaleTag[0]
                : 1,
              pixelHeight: metadata.ModelPixelScaleTag
                ? Math.abs(metadata.ModelPixelScaleTag[1])
                : 1,
              xmin: metadata.ModelTiepointTag
                ? metadata.ModelTiepointTag[3]
                : 0,
              ymax: metadata.ModelTiepointTag
                ? metadata.ModelTiepointTag[4]
                : 0,
              width: metadata.ImageWidth,
              height: metadata.ImageLength,
              _data: tiff, // Keep reference to original data
              _metadata: metadata, // Keep original metadata
              sourceType: "manual", // Flag to indicate this is a manual raster
              pixelDepth: metadata.BitsPerSample
                ? metadata.BitsPerSample[0]
                : 8,
            };

            console.log("Manually created raster object:", {
              width: manualGeoraster.width,
              height: manualGeoraster.height,
              noDataValue: manualGeoraster.noDataValue,
              projection: manualGeoraster.projection,
              hasValueArray: !!manualGeoraster.values,
            });

            setResultData(manualGeoraster);
            displayRasterLayer(manualGeoraster);
          }
        } catch (error: any) {
          console.error("Error parsing with GeoTIFF library:", error);
          throw new Error(
            `GeoTIFF parsing failed: ${error.message || String(error)}`
          );
        }
      } catch (parseError: any) {
        console.error("Error parsing GeoTIFF:", parseError);
        setError(
          `Error parsing the response as GeoTIFF: ${
            parseError.message || String(parseError)
          }. The server may have returned an error or invalid data.`
        );
      }
    } catch (err: any) {
      console.error("Error during processing:", {
        errorCode: err.code,
        errorMessage: err.message?.substring(0, 200) || String(err),
      });

      // Check if the error is from Parse Cloud
      let errorMessage = err.message;
      if (err.code === Parse.Error.INTERNAL_SERVER_ERROR && err.message) {
        try {
          // Try to parse the error message if it's JSON
          if (err.message.includes("{")) {
            const jsonStartIndex = err.message.indexOf("{");
            const jsonPart = err.message.substring(jsonStartIndex);
            const parsedError = JSON.parse(jsonPart);
            errorMessage = `Server error: ${
              parsedError.message || err.message
            }`;
            console.log(
              "Parsed server error:",
              parsedError.message || "Unknown server error"
            );
          }
        } catch (parseError) {
          // If can't parse, just use the original message
          console.log("Using original error message (parsing failed)");
        }
      }

      setError(`Error: ${errorMessage}`);
    } finally {
      setUploading(false);
      setProcessing(false);
      if (!resultData) {
        setResultBlob(""); // Only reset if there was an error
      }
      setFileList([]);
    }
  };

  // Helper function to convert bytes to a human-readable format
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper function to read a file as ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  // Helper function to convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    // First, decode the base64 string to a binary string
    const binaryString = window.atob(base64);
    const len = binaryString.length;

    // Create a buffer and view to hold the binary data
    const bytes = new Uint8Array(len);

    // Copy each byte into the buffer
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i) & 0xff; // Use bitwise AND to ensure correct byte value
    }

    return bytes.buffer;
  };

  // Helper function to download a file from an ArrayBuffer
  const downloadFile = (
    buffer: ArrayBuffer,
    filename: string,
    mimeType: string = "image/tiff"
  ) => {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayRasterLayer = async (georaster: any) => {
    console.log("displayRasterLayer called with:", georaster);

    if (!leafletMap.current) {
      console.error("Map reference is not available");
      setError("Map reference is not available. Try refreshing the page.");
      return;
    }

    try {
      // Check if the georaster has valid data
      if (!georaster || !georaster.values || georaster.values.length === 0) {
        console.error("GeoRaster data is empty or invalid:", georaster);
        setError("GeoRaster data is empty or invalid.");
        return;
      }

      // Remove any existing raster layer
      if (rasterLayer.current) {
        console.log("Removing existing raster layer");
        leafletMap.current.removeLayer(rasterLayer.current);
      }

      console.log("Creating new raster layer with data:", {
        width: georaster.width,
        height: georaster.height,
        noDataValue: georaster.noDataValue,
        projection: georaster.projection,
        hasValueArray: !!georaster.values,
        sourceType: georaster.sourceType || "standard",
      });

      // Special handling for manual raster objects
      let layerOptions: any = {
        georaster: georaster,
        opacity: 0.7,
        pixelValuesToColorFn: (values: number[]) => {
          const value = values[0];
          if (value === undefined || value === null || isNaN(value)) {
            return null; // Transparent for NODATA
          }
          return interpolateColor(value);
        },
        resolution: 512,
      };

      // If this is a manually created raster, add missing methods that GeoRasterLayer expects
      if (georaster.sourceType === "manual") {
        console.log("Using manual raster object with customized methods");

        // Create a wrapper for the georaster with additional methods
        const geoRasterWrapper = {
          ...georaster,
          // Add any methods that GeoRasterLayer expects
          getBoundingBox: () => {
            return [
              georaster.xmin,
              georaster.ymax - georaster.height * georaster.pixelHeight,
              georaster.xmin + georaster.width * georaster.pixelWidth,
              georaster.ymax,
            ];
          },
          getValues: () => georaster.values,
          getProjection: () => georaster.projection || "EPSG:4326",
        };

        layerOptions.georaster = geoRasterWrapper;
      }

      // Create a new raster layer with prepared options
      const newRasterLayer = new GeoRasterLayer(layerOptions);

      console.log("Adding raster layer to map");
      // Add the layer to the map
      newRasterLayer.addTo(leafletMap.current);
      rasterLayer.current = newRasterLayer;

      // Check if the layer has bounds
      if (newRasterLayer.getBounds) {
        console.log("Fitting map to raster bounds");
        // Fit the map to the raster bounds
        const layerBounds = newRasterLayer.getBounds();
        if (layerBounds && layerBounds.isValid()) {
          leafletMap.current.fitBounds(layerBounds);
        } else {
          console.warn("Layer bounds are invalid:", layerBounds);
          // Default view if bounds are invalid
          leafletMap.current.setView([41.7, 1.7], 7);
        }
      } else {
        console.warn("Layer does not have getBounds method");
        // Default view
        leafletMap.current.setView([41.7, 1.7], 7);
      }
    } catch (error: any) {
      console.error("Error displaying raster layer:", error);
      setError(
        `Error displaying raster layer: ${error.message || String(error)}`
      );
    }
  };
  const props = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file: any) => {
      // Check if it's a valid file object
      if (!file || !(file instanceof File)) {
        message.error("Invalid file object");
        return Upload.LIST_IGNORE;
      }

      // Check file type
      const isTiff =
        file.name.toLowerCase().endsWith(".tif") ||
        file.name.toLowerCase().endsWith(".tiff");

      if (!isTiff) {
        message.error(`${file.name} is not a TIFF file`);
        return Upload.LIST_IGNORE;
      }

      setFileList([
        {
          uid: "-1",
          name: file.name,
          status: "done",
          originFileObj: file,
        },
      ]);
      return false;
    },
    fileList,
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
            flexDirection: "column",
          }}
        >
          <h1>BioConn API Test</h1>
          <Card title="API Parameters" style={{ marginBottom: "20px" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Type:
                </label>
                <Radio.Group
                  options={typeOptions}
                  onChange={(e) => setType(e.target.value)}
                  value={type}
                  optionType="button"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Mode:
                </label>
                <Radio.Group
                  options={modeOptions}
                  onChange={(e) => setMode(e.target.value)}
                  value={mode}
                  optionType="button"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  TIFF File:
                </label>
                <Upload {...props}>
                  <Button icon={<UploadOutlined />}>Select File</Button>
                </Upload>
              </div>

              <Button
                type="primary"
                onClick={handleUpload}
                disabled={fileList.length === 0}
                loading={uploading}
                style={{ marginTop: "10px" }}
              >
                Process TIFF
              </Button>
            </Space>
          </Card>{" "}
          <Card title="Results" style={{ marginBottom: "20px" }}>
            {processing && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin size="large" />
                <p>
                  Processing your request... Large files may take up to 20
                  minutes.
                </p>
                <p>Please be patient and do not close this window.</p>
              </div>
            )}{" "}
            {resultBlob && !processing && (
              <div
                style={{ marginBottom: "15px", marginTop: error ? 0 : "15px" }}
              >
                <Button
                  type="primary"
                  onClick={() => {
                    const blob = new Blob([base64ToArrayBuffer(resultBlob)], {
                      type: "image/tiff",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "bioconn-response.tiff";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download TIFF from API
                </Button>
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  This downloads the raw TIFF file returned from the BioConn
                  API, regardless of parsing success.
                </p>
              </div>
            )}
            {error && (
              <div>
                <div style={{ color: "red", marginBottom: "10px" }}>
                  <h3>Error Parsing GeoTIFF</h3>
                  <p>{error}</p>
                  <p>
                    This may be due to an issue with the metadata in the GeoTIFF
                    file. Try with a different file or a different type/mode
                    combination.
                  </p>
                </div>
                {resultBlob && (
                  <div
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <Button
                      onClick={async () => {
                        try {
                          setError("");
                          setProcessing(true);
                          const arrayBuffer = base64ToArrayBuffer(resultBlob);
                          console.log(
                            `Retrying GeoTIFF parsing with data: ${formatBytes(
                              arrayBuffer.byteLength
                            )}`
                          );

                          // Use the more robust parsing approach
                          try {
                            const GeoTIFF = require("geotiff");
                            console.log(
                              "Attempting to parse with GeoTIFF library directly..."
                            );

                            // First, parse with GeoTIFF.js to get metadata
                            const tiff = await GeoTIFF.fromArrayBuffer(
                              arrayBuffer
                            );
                            const image = await tiff.getImage();
                            const metadata = image.getFileDirectory();
                            const fileValues = await image.readRasters();

                            console.log(
                              "GeoTIFF metadata extracted successfully:",
                              {
                                imageWidth: metadata.ImageWidth,
                                imageLength: metadata.ImageLength,
                                hasTileInfo: !!metadata.TileWidth,
                                hasBitsPerSample: !!metadata.BitsPerSample,
                                hasSampleFormat: !!metadata.SampleFormat,
                                geoKeys: metadata.GeoKeyDirectory
                                  ? "present"
                                  : "missing",
                                fileValues: fileValues
                                  ? "data present"
                                  : "no data",
                              }
                            );

                            // Try standard geoblaze parse first
                            try {
                              const georaster = await geoblaze.parse(
                                arrayBuffer
                              );
                              console.log(
                                "Retry successful - GeoTIFF parsed with geoblaze:",
                                {
                                  width: georaster.width,
                                  height: georaster.height,
                                  noDataValue: georaster.noDataValue,
                                }
                              );
                              setResultData(georaster);
                              displayRasterLayer(georaster);
                            } catch (geoblazeError) {
                              console.error(
                                "Geoblaze parsing failed, using manual raster approach:",
                                geoblazeError
                              );

                              // Create a manual georaster object
                              const values = fileValues ? [fileValues[0]] : [];

                              const manualGeoraster = {
                                values: values,
                                noDataValue: metadata.GDAL_NODATA || 0,
                                projection: metadata.GeoKeyDirectory
                                  ? "EPSG:4326"
                                  : undefined,
                                pixelWidth: metadata.ModelPixelScaleTag
                                  ? metadata.ModelPixelScaleTag[0]
                                  : 1,
                                pixelHeight: metadata.ModelPixelScaleTag
                                  ? Math.abs(metadata.ModelPixelScaleTag[1])
                                  : 1,
                                xmin: metadata.ModelTiepointTag
                                  ? metadata.ModelTiepointTag[3]
                                  : 0,
                                ymax: metadata.ModelTiepointTag
                                  ? metadata.ModelTiepointTag[4]
                                  : 0,
                                width: metadata.ImageWidth,
                                height: metadata.ImageLength,
                                _data: tiff,
                                _metadata: metadata,
                                sourceType: "manual",
                                pixelDepth: metadata.BitsPerSample
                                  ? metadata.BitsPerSample[0]
                                  : 8,
                              };

                              console.log("Manually created raster object:", {
                                width: manualGeoraster.width,
                                height: manualGeoraster.height,
                                noDataValue: manualGeoraster.noDataValue,
                                hasValueArray: !!manualGeoraster.values,
                              });

                              setResultData(manualGeoraster);
                              displayRasterLayer(manualGeoraster);
                            }
                          } catch (error: any) {
                            console.error(
                              "Error during retry with GeoTIFF library:",
                              error
                            );
                            throw new Error(
                              `GeoTIFF parsing failed: ${
                                error.message || String(error)
                              }`
                            );
                          }
                        } catch (err: any) {
                          console.error("Error retrying GeoTIFF parsing:", err);
                          setError(`Error retrying: ${err.message}`);
                        } finally {
                          setProcessing(false);
                        }
                      }}
                    >
                      Retry GeoTIFF Parsing
                    </Button>{" "}
                    <Button
                      onClick={() => {
                        const blob = new Blob(
                          [base64ToArrayBuffer(resultBlob)],
                          {
                            type: "image/tiff",
                          }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "tiff-for-debugging.tiff";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Raw TIFF for Debugging
                    </Button>
                    <p style={{ fontSize: "12px", color: "#666" }}>
                      Note: The download button provides the raw file that
                      caused the error, which may help in diagnosing the issue
                      with external GeoTIFF viewers.
                    </p>
                  </div>
                )}
              </div>
            )}
            {resultData && (
              <div>
                <p>Successfully processed TIFF file!</p>
                <Button
                  onClick={() => {
                    const blob = new Blob([base64ToArrayBuffer(resultBlob)], {
                      type: "image/tiff",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "processed-geotiff.tiff";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  style={{ marginBottom: "10px" }}
                >
                  Download GeoTIFF File
                </Button>
                <div
                  ref={mapRef}
                  style={{
                    height: "500px",
                    width: "100%",
                    marginTop: "10px",
                  }}
                ></div>
              </div>
            )}
          </Card>
        </div>
      </ConfigProvider>
    </>
  );
};

export default BioConnTest;
