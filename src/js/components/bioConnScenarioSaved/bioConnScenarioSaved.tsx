import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  message,
  Spin,
  Empty,
  Modal,
  Select,
  Space,
  Typography,
  ConfigProvider,
  Tooltip,
  Input,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Parse from "parse";
import { useNavigate } from "@opendash/router";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import geoblaze from "geoblaze";
import "leaflet/dist/leaflet.css";

const { Option } = Select;
const { Title, Text } = Typography;

// API parameter types (1, 3, 4, 5, 6 as requested)
const apiParameterTypes = [
  { value: 1, label: "Aquatic" },
  { value: 3, label: "Herbaceous cropland" },
  { value: 4, label: "Woody cropland" },
  { value: 5, label: "Shrubland and grassland" },
  { value: 6, label: "Forestland" },
];

// Helper function to get file extension and type
const getFileInfo = (fileName: string, contentType: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "json" || contentType.includes("application/json")) {
    return { extension: ".json", type: "JSON" };
  } else if (
    extension === "tiff" ||
    extension === "tif" ||
    contentType.includes("image/tiff")
  ) {
    return { extension: ".tiff", type: "GeoTIFF" };
  }

  return { extension: ".json", type: "JSON" }; // Default fallback
};

// Function to interpolate colors based on land cover values
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

// Function to create a preview canvas from georaster
const createPreviewCanvas = async (
  georaster: any
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  // Set canvas size (create a smaller preview)
  const maxSize = 200;
  const aspectRatio = georaster.width / georaster.height;

  if (aspectRatio > 1) {
    canvas.width = maxSize;
    canvas.height = maxSize / aspectRatio;
  } else {
    canvas.width = maxSize * aspectRatio;
    canvas.height = maxSize;
  }

  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  // Sample the georaster data to fit the canvas
  const xStep = georaster.width / canvas.width;
  const yStep = georaster.height / canvas.height;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const sourceX = Math.floor(x * xStep);
      const sourceY = Math.floor(y * yStep);

      // Get the pixel value from the georaster
      const value = georaster.values[0][sourceY]?.[sourceX] || 0;

      // Convert to RGB
      const color = interpolateColor(value);
      const rgb = color.match(/\d+/g);

      if (rgb) {
        const pixelIndex = (y * canvas.width + x) * 4;
        data[pixelIndex] = parseInt(rgb[0]); // R
        data[pixelIndex + 1] = parseInt(rgb[1]); // G
        data[pixelIndex + 2] = parseInt(rgb[2]); // B
        data[pixelIndex + 3] = color.includes("rgba")
          ? parseInt(rgb[3]) * 255
          : 255; // A
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// Function to process scenario with API
const processScenarioWithAPI = async (
  combinedRaster: any,
  apiParameterType: number,
  apiMode: "high" | "low",
  navigate: Function,
  scenarioName: string
) => {
  try {
    message.loading({
      content: "Processing scenario...",
      key: "bioconn",
    });

    // Debug: Log the combinedRaster structure (should match creation page now)
    console.log("DEBUG (Saved): CombinedRaster structure:", combinedRaster);
    console.log(
      "DEBUG (Saved): CombinedRaster properties:",
      Object.keys(combinedRaster)
    );
    console.log("DEBUG (Saved): Values structure:", {
      values: combinedRaster.values,
      valuesType: typeof combinedRaster.values,
      valuesIsArray: Array.isArray(combinedRaster.values),
      valuesLength: combinedRaster.values?.length,
      firstBandType: typeof combinedRaster.values?.[0],
      firstBandIsArray: Array.isArray(combinedRaster.values?.[0]),
    });

    // Convert combinedRaster to the format expected by the API (same as creation page)
    const { width, height, values, xmin, ymin, xmax, ymax } = combinedRaster;

    // Debug: Log extracted properties
    console.log("DEBUG (Saved): Extracted properties:", {
      width,
      height,
      xmin,
      ymin,
      xmax,
      ymax,
      valuesExists: !!values,
    });

    // Properly extract and flatten the raster values (same logic as creation page)
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

    console.log("DEBUG (Saved): Flattened values:", {
      flattenedValuesType: typeof flattenedValues,
      flattenedValuesLength: flattenedValues?.length,
      firstFewValues: flattenedValues?.slice(0, 10),
    });

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

    console.log("DEBUG (Saved): Metadata:", metadata);

    // Convert to appropriate array if needed
    const typedArray =
      flattenedValues instanceof Uint8Array
        ? flattenedValues
        : new Uint8Array(flattenedValues);

    console.log("DEBUG (Saved): Typed array:", {
      typedArrayType: typeof typedArray,
      typedArrayLength: typedArray.length,
      firstFewValues: Array.from(typedArray.slice(0, 10)),
    });

    // Create GeoTIFF using writeArrayBuffer with metadata
    const { writeArrayBuffer } = await import("geotiff");
    const tiff = await writeArrayBuffer(typedArray, metadata);

    console.log(
      "DEBUG (Saved): GeoTIFF created successfully, size:",
      tiff.byteLength
    );

    // Create downloadable GeoTIFF ArrayBuffer for the compare scenario
    const downloadableGeoTiff = new ArrayBuffer(tiff.byteLength);
    new Uint8Array(downloadableGeoTiff).set(new Uint8Array(tiff));

    // Export as blob for API transmission
    const blob = new Blob([tiff], { type: "image/tiff" });

    // Convert GeoTIFF to base64 for transmission
    const base64Data = await new Promise<string>((resolve, reject) => {
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

    console.log("DEBUG (Saved): Base64 data length:", base64Data.length);
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

    // Navigate to the compare view with both original raster, API response, and downloadable GeoTIFF
    navigate("/bioconnect/compare", {
      state: {
        originalRaster: {
          ...combinedRaster,
          downloadableGeoTiff: downloadableGeoTiff, // Add the downloadable GeoTIFF ArrayBuffer
        },
        apiResponse: result,
        scenarioName: scenarioName,
      },
    });
  } catch (error: any) {
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
  }
};

interface SavedScenario {
  id: string;
  name: string;
  createdAt: Date;
  scenarioFile: Parse.File;
  user: Parse.User;
}

const BioConnScenarioSaved: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    scenario: SavedScenario | null;
    canvas: HTMLCanvasElement | null;
  }>({
    visible: false,
    scenario: null,
    canvas: null,
  });
  const [processModal, setProcessModal] = useState<{
    visible: boolean;
    scenario: SavedScenario | null;
    apiParameterType: number;
    apiMode: "high" | "low";
    processing: boolean;
  }>({
    visible: false,
    scenario: null,
    apiParameterType: 6,
    apiMode: "high",
    processing: false,
  });

  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    scenario: SavedScenario | null;
    newName: string;
    saving: boolean;
  }>({
    visible: false,
    scenario: null,
    newName: "",
    saving: false,
  });

  const [uploadModal, setUploadModal] = useState<{
    visible: boolean;
    file: File | null;
    apiParameterType: number;
    apiMode: "high" | "low";
    processing: boolean;
  }>({
    visible: false,
    file: null,
    apiParameterType: 6,
    apiMode: "high",
    processing: false,
  });

  // Load scenarios from Parse
  const loadScenarios = async () => {
    try {
      setLoading(true);

      const currentUser = Parse.User.current();
      if (!currentUser) {
        message.error("You must be logged in to view saved scenarios");
        return;
      }

      const ScenarioClass = Parse.Object.extend("AD4GD_Scenario");
      const query = new Parse.Query(ScenarioClass);

      // Filter by current user
      query.equalTo("user", currentUser);
      query.descending("createdAt");

      const results = await query.find();

      const scenarioData: SavedScenario[] = results.map((scenario) => ({
        id: scenario.id,
        name: scenario.get("name"),
        createdAt: scenario.get("createdAt"),
        scenarioFile: scenario.get("scenario"),
        user: scenario.get("user"),
      }));

      setScenarios(scenarioData);
    } catch (error: any) {
      console.error("Error loading scenarios:", error);
      message.error(`Failed to load scenarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete scenario
  const deleteScenario = async (scenarioId: string) => {
    try {
      const ScenarioClass = Parse.Object.extend("AD4GD_Scenario");
      const query = new Parse.Query(ScenarioClass);
      const scenario = await query.get(scenarioId);

      await scenario.destroy();

      // Remove from local state
      setScenarios(scenarios.filter((s) => s.id !== scenarioId));

      message.success("Scenario deleted successfully");
    } catch (error: any) {
      console.error("Error deleting scenario:", error);
      message.error(`Failed to delete scenario: ${error.message}`);
    }
  };

  // Rename scenario
  const renameScenario = async () => {
    if (!renameModal.scenario || !renameModal.newName.trim()) return;

    try {
      setRenameModal((prev) => ({ ...prev, saving: true }));

      message.loading({
        content: "Renaming scenario and updating file...",
        key: "rename",
      });

      const ScenarioClass = Parse.Object.extend("AD4GD_Scenario");
      const query = new Parse.Query(ScenarioClass);
      const scenario = await query.get(renameModal.scenario.id);

      // Get the current scenario file
      const currentFile = scenario.get("scenario") as Parse.File;

      if (currentFile) {
        try {
          // Download the current file content
          const response = await fetch(currentFile.url());

          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status}`);
          }

          const blob = await response.blob();

          // Determine the file extension from the original file
          const contentType = response.headers.get("content-type") || "";
          const originalName = currentFile.name() || "";
          const { extension } = getFileInfo(originalName, contentType);

          // Create a new file with the updated name
          const newFileName = `${renameModal.newName.trim()}${extension}`;
          const newFile = new Parse.File(newFileName, blob);

          // Save the new file
          await newFile.save();

          // Update the scenario with the new name and new file
          scenario.set("name", renameModal.newName.trim());
          scenario.set("scenario", newFile);
          await scenario.save();

          console.log(
            `Scenario renamed: "${
              renameModal.scenario.name
            }" -> "${renameModal.newName.trim()}", File: "${originalName}" -> "${newFileName}"`
          );
        } catch (fileError: any) {
          console.warn("Error updating file, updating name only:", fileError);
          // Fallback: just update the name if file operations fail
          scenario.set("name", renameModal.newName.trim());
          await scenario.save();

          message.warning(
            "Scenario name updated, but file name could not be changed"
          );
        }
      } else {
        // If no file exists, just update the name
        scenario.set("name", renameModal.newName.trim());
        await scenario.save();
      }

      // Update local state with new file reference
      setScenarios(
        scenarios.map((s) =>
          s.id === renameModal.scenario!.id
            ? {
                ...s,
                name: renameModal.newName.trim(),
                scenarioFile: scenario.get("scenario"), // Update with new file reference
              }
            : s
        )
      );

      message.success({
        content: "Scenario and file renamed successfully",
        key: "rename",
      });

      setRenameModal({
        visible: false,
        scenario: null,
        newName: "",
        saving: false,
      });
    } catch (error: any) {
      console.error("Error renaming scenario:", error);
      message.error({
        content: `Failed to rename scenario: ${error.message}`,
        key: "rename",
      });
      setRenameModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Download scenario
  const downloadScenario = async (scenario: SavedScenario) => {
    try {
      message.loading({
        content: "Preparing download...",
        key: "download",
      });

      // Download the scenario file
      const response = await fetch(scenario.scenarioFile.url());
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Determine file extension using helper function
      const contentType = response.headers.get("content-type") || "";
      const originalName = scenario.scenarioFile.name() || "";
      const { extension } = getFileInfo(originalName, contentType);

      link.download = `${scenario.name}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success({ content: "Download started", key: "download" });
    } catch (error: any) {
      console.error("Error downloading scenario:", error);
      message.error(`Failed to download scenario: ${error.message}`);
    }
  };

  // Upload and process scenario
  const handleUploadAndProcess = async () => {
    if (!uploadModal.file) return;

    try {
      setUploadModal((prev) => ({ ...prev, processing: true }));

      message.loading({
        content: "Processing uploaded scenario...",
        key: "upload",
      });

      const fileInfo = getFileInfo(uploadModal.file.name, "");
      let combinedRaster;

      if (fileInfo.type === "JSON") {
        // JSON format
        const text = await uploadModal.file.text();
        combinedRaster = JSON.parse(text);
        console.log("Processing uploaded JSON scenario:", combinedRaster);

        // Remove metadata if present
        delete combinedRaster._scenarioMetadata;
      } else if (fileInfo.type === "GeoTIFF") {
        // GeoTIFF format
        const arrayBuffer = await uploadModal.file.arrayBuffer();
        combinedRaster = await geoblaze.parse(arrayBuffer);
        console.log("Processing uploaded GeoTIFF scenario:", combinedRaster);
      } else {
        throw new Error(
          "Unsupported file format. Please upload a .json or .tiff file."
        );
      }

      // Process with API
      await processScenarioWithAPI(
        combinedRaster,
        uploadModal.apiParameterType,
        uploadModal.apiMode,
        navigate,
        uploadModal.file.name.split(".")[0] // Use filename as scenario name
      );

      setUploadModal({
        visible: false,
        file: null,
        apiParameterType: 6,
        apiMode: "high",
        processing: false,
      });

      message.success({
        content: "Upload and processing completed",
        key: "upload",
      });
    } catch (error: any) {
      console.error("Error processing uploaded file:", error);
      message.error(`Failed to process uploaded file: ${error.message}`);
      setUploadModal((prev) => ({ ...prev, processing: false }));
    }
  };

  // Preview scenario
  const previewScenario = async (scenario: SavedScenario) => {
    try {
      message.loading({
        content: "Loading scenario preview...",
        key: "preview",
      });

      // Download the scenario file
      const response = await fetch(scenario.scenarioFile.url());

      let combinedRaster;

      // Check if it's the new JSON format or old GeoTIFF format
      const contentType = response.headers.get("content-type") || "";
      const fileName = scenario.scenarioFile.name() || "";

      if (
        contentType.includes("application/json") ||
        fileName.endsWith(".json")
      ) {
        // New format: JSON data with raw combinedRaster structure
        const jsonText = await response.text();
        combinedRaster = JSON.parse(jsonText);
        console.log("Loaded scenario from JSON format:", combinedRaster);
      } else {
        // Old format: GeoTIFF file - parse with geoblaze
        const arrayBuffer = await response.arrayBuffer();
        combinedRaster = await geoblaze.parse(arrayBuffer);
        console.log("Loaded scenario from GeoTIFF format:", combinedRaster);
      }

      // Create preview canvas
      const canvas = await createPreviewCanvas(combinedRaster);

      setPreviewModal({
        visible: true,
        scenario,
        canvas,
      });

      message.success({ content: "Preview loaded", key: "preview" });
    } catch (error: any) {
      console.error("Error previewing scenario:", error);
      message.error(`Failed to preview scenario: ${error.message}`);
    }
  };

  // Process scenario
  const handleProcessScenario = async () => {
    if (!processModal.scenario) return;

    try {
      setProcessModal((prev) => ({ ...prev, processing: true }));

      // Download the scenario file
      const response = await fetch(processModal.scenario.scenarioFile.url());

      let combinedRaster;

      // Check if it's the new JSON format or old GeoTIFF format
      const contentType = response.headers.get("content-type") || "";
      const fileName = processModal.scenario.scenarioFile.name() || "";

      if (
        contentType.includes("application/json") ||
        fileName.endsWith(".json")
      ) {
        // New format: JSON data with raw combinedRaster structure
        const jsonText = await response.text();
        combinedRaster = JSON.parse(jsonText);
        console.log("Processing scenario from JSON format:", combinedRaster);

        // Remove metadata before processing
        delete combinedRaster._scenarioMetadata;
      } else {
        // Old format: GeoTIFF file - parse with geoblaze
        const arrayBuffer = await response.arrayBuffer();
        combinedRaster = await geoblaze.parse(arrayBuffer);
        console.log("Processing scenario from GeoTIFF format:", combinedRaster);
      }

      // Process with API using the same function as creation page
      await processScenarioWithAPI(
        combinedRaster,
        processModal.apiParameterType,
        processModal.apiMode,
        navigate,
        processModal.scenario.name
      );

      setProcessModal({
        visible: false,
        scenario: null,
        apiParameterType: 6,
        apiMode: "high",
        processing: false,
      });
    } catch (error: any) {
      console.error("Error processing scenario:", error);
      setProcessModal((prev) => ({ ...prev, processing: false }));
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  return (
    <>
      <style>
        {`
          .ant-tooltip .ant-tooltip-inner {
            background: rgba(0, 0, 0, 0.8) !important;
            color: white !important;
            border: none !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            padding: 8px 12px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          }
          .ant-tooltip .ant-tooltip-arrow::before {
            background: rgba(0, 0, 0, 0.8) !important;
          }
          .ant-tooltip .ant-tooltip-arrow::after {
            background: rgba(0, 0, 0, 0.8) !important;
          }
        `}
      </style>
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
        <Row style={{ width: "100%", height: "100px" }}>
          <WidgetStatic
            style={{ width: "100%", height: "100%" }}
            type="header-bioconn-widget"
            config={""}
          />
        </Row>

        <div
          style={{
            padding: "20px",
            width: "70%",
            margin: "0 auto",
            minHeight: "80vh",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <Title level={2}>Saved Scenarios</Title>
            <Text type="secondary">
              View and process your saved BioConn scenarios
            </Text>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <Button
              type="primary"
              onClick={() => navigate("/bioconnect/scenario")}
            >
              Create New Scenario
            </Button>
            <Button
              type="default"
              icon={<UploadOutlined />}
              onClick={() =>
                setUploadModal({
                  visible: true,
                  file: null,
                  apiParameterType: 6,
                  apiMode: "high",
                  processing: false,
                })
              }
            >
              Upload & Process Scenario
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spin size="large" />
            </div>
          ) : scenarios.length === 0 ? (
            <Empty
              description="No saved scenarios found"
              style={{ marginTop: "50px" }}
            />
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {scenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  hoverable
                  style={{
                    width: "100%",
                    minHeight: "120px",
                  }}
                  bodyStyle={{
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <Title
                          level={4}
                          style={{ margin: 0, marginBottom: "8px" }}
                        >
                          {scenario.name}
                        </Title>
                        <Text type="secondary">
                          Created: {scenario.createdAt.toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Tooltip title="Preview scenario">
                      <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => previewScenario(scenario)}
                      />
                    </Tooltip>
                    <Tooltip title="Rename scenario">
                      <Button
                        type="default"
                        icon={<EditOutlined />}
                        onClick={() =>
                          setRenameModal({
                            visible: true,
                            scenario,
                            newName: scenario.name,
                            saving: false,
                          })
                        }
                      />
                    </Tooltip>
                    <Tooltip title="Download scenario">
                      <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadScenario(scenario)}
                      />
                    </Tooltip>
                    <Tooltip title="Process scenario">
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() =>
                          setProcessModal({
                            visible: true,
                            scenario,
                            apiParameterType: 6,
                            apiMode: "high",
                            processing: false,
                          })
                        }
                      />
                    </Tooltip>
                    <Tooltip title="Delete scenario">
                      <Button
                        type="default"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          Modal.confirm({
                            title: "Delete Scenario",
                            content: `Are you sure you want to delete "${scenario.name}"?`,
                            onOk: () => deleteScenario(scenario.id),
                            cancelText: "Cancel",
                          });
                        }}
                      />
                    </Tooltip>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Preview Modal */}
          <Modal
            title={`Preview: ${previewModal.scenario?.name}`}
            open={previewModal.visible}
            onCancel={() =>
              setPreviewModal({ visible: false, scenario: null, canvas: null })
            }
            footer={null}
            width={400}
          >
            {previewModal.canvas && (
              <div style={{ textAlign: "center" }}>
                <div
                  ref={(div) => {
                    if (div && previewModal.canvas) {
                      div.innerHTML = "";
                      div.appendChild(previewModal.canvas);
                    }
                  }}
                  style={{ marginBottom: "10px" }}
                />
                <Text type="secondary">
                  Scenario preview (land cover visualization)
                </Text>
              </div>
            )}
          </Modal>

          {/* Process Modal */}
          <Modal
            title={`Process: ${processModal.scenario?.name}`}
            open={processModal.visible}
            onOk={handleProcessScenario}
            onCancel={() =>
              setProcessModal({
                visible: false,
                scenario: null,
                apiParameterType: 6,
                apiMode: "high",
                processing: false,
              })
            }
            confirmLoading={processModal.processing}
            cancelText="Cancel"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  API Parameter Type
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={processModal.apiParameterType}
                  onChange={(value) =>
                    setProcessModal((prev) => ({
                      ...prev,
                      apiParameterType: value,
                      apiMode: value !== 6 ? "low" : prev.apiMode,
                    }))
                  }
                >
                  {apiParameterTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.value} - {type.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Processing Mode
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={processModal.apiMode}
                  onChange={(value) =>
                    setProcessModal((prev) => ({ ...prev, apiMode: value }))
                  }
                >
                  <Option
                    value="high"
                    disabled={processModal.apiParameterType !== 6}
                  >
                    High Resolution{" "}
                    {processModal.apiParameterType !== 6 ? "(Forest only)" : ""}
                  </Option>
                  <Option value="low">Low Resolution (All types)</Option>
                </Select>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color:
                    processModal.apiParameterType === 6 ? "#52c41a" : "#ff6b6b",
                }}
              >
                {processModal.apiParameterType === 6
                  ? "✓ High resolution available for Forestland"
                  : "⚠ High resolution is only available for Forestland (type 6)"}
              </div>
            </Space>
          </Modal>

          {/* Rename Modal */}
          <Modal
            title="Rename Scenario"
            open={renameModal.visible}
            onOk={renameScenario}
            onCancel={() =>
              setRenameModal({
                visible: false,
                scenario: null,
                newName: "",
                saving: false,
              })
            }
            confirmLoading={renameModal.saving}
            okText="Rename"
            cancelText="Cancel"
          >
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Scenario Name
              </label>
              <Input
                value={renameModal.newName}
                onChange={(e) =>
                  setRenameModal((prev) => ({
                    ...prev,
                    newName: e.target.value,
                  }))
                }
                placeholder="Enter new scenario name"
                maxLength={100}
              />
            </div>
          </Modal>

          {/* Upload and Process Modal */}
          <Modal
            title="Upload & Process Scenario"
            open={uploadModal.visible}
            onOk={handleUploadAndProcess}
            onCancel={() =>
              setUploadModal({
                visible: false,
                file: null,
                apiParameterType: 6,
                apiMode: "high",
                processing: false,
              })
            }
            confirmLoading={uploadModal.processing}
            okText="Process"
            cancelText="Cancel"
            okButtonProps={{ disabled: !uploadModal.file }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Upload Scenario File
                </label>
                <Upload
                  beforeUpload={(file) => {
                    const fileExtension = file.name
                      .split(".")
                      .pop()
                      ?.toLowerCase();
                    if (
                      fileExtension !== "json" &&
                      fileExtension !== "tiff" &&
                      fileExtension !== "tif"
                    ) {
                      message.error("Please upload a .json or .tiff file");
                      return false;
                    }
                    setUploadModal((prev) => ({ ...prev, file }));
                    return false; // Prevent automatic upload
                  }}
                  fileList={
                    uploadModal.file
                      ? [
                          {
                            uid: "1",
                            name: uploadModal.file.name,
                            status: "done",
                          },
                        ]
                      : []
                  }
                  onRemove={() =>
                    setUploadModal((prev) => ({ ...prev, file: null }))
                  }
                  accept=".json,.tiff,.tif"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    {uploadModal.file ? "Change File" : "Select File"}
                  </Button>
                </Upload>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  Supported formats: .json
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  API Parameter Type
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={uploadModal.apiParameterType}
                  onChange={(value) =>
                    setUploadModal((prev) => ({
                      ...prev,
                      apiParameterType: value,
                      apiMode: value !== 6 ? "low" : prev.apiMode,
                    }))
                  }
                >
                  {apiParameterTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.value} - {type.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Processing Mode
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={uploadModal.apiMode}
                  onChange={(value) =>
                    setUploadModal((prev) => ({ ...prev, apiMode: value }))
                  }
                >
                  <Option
                    value="high"
                    disabled={uploadModal.apiParameterType !== 6}
                  >
                    High Resolution{" "}
                    {uploadModal.apiParameterType !== 6 ? "(Forest only)" : ""}
                  </Option>
                  <Option value="low">Low Resolution (All types)</Option>
                </Select>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color:
                    uploadModal.apiParameterType === 6 ? "#52c41a" : "#ff6b6b",
                }}
              >
                {uploadModal.apiParameterType === 6
                  ? "✓ High resolution available for Forestland"
                  : "⚠ High resolution is only available for Forestland (type 6)"}
              </div>
            </Space>
          </Modal>
        </div>
      </ConfigProvider>
    </>
  );
};

export default BioConnScenarioSaved;
