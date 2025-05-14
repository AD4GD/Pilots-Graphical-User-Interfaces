import React, { useState, useRef } from "react";
import {
  Upload,
  Button,
  Card,
  Spin,
  Collapse,
  Typography,
  Divider,
  Alert,
  Space,
} from "antd";
import {
  UploadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import geoblaze from "geoblaze";
import * as GeoTIFF from "geotiff";

const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

const GeoTiffExplorer: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [georaster, setGeoraster] = useState<any>(null);
  const [tiffData, setTiffData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>("");
  const [imageData, setImageData] = useState<any>(null);

  const extractTiffData = async (image: any) => {
    try {
      // Get basic TIFF data
      const metadata = image.getFileDirectory();
      const geoKeys = image.getGeoKeys ? image.getGeoKeys() : null;
      const width = image.getWidth();
      const height = image.getHeight();
      const samples = image.getSamplesPerPixel();
      const bitsPerSample = metadata.BitsPerSample;
      const compressionType = metadata.Compression;

      // Get resolution and bounding box (may fail for non-geo TIFFs)
      let resolution = null;
      let bbox = null;

      try {
        resolution = image.getResolution();
      } catch (e) {
        console.warn("Could not get resolution:", e);
      }

      try {
        bbox = image.getBoundingBox();
      } catch (e) {
        console.warn("Could not get bounding box:", e);
      }

      // Try to read some raster data for visualization
      try {
        // Read first band data for preview (might be large, so limit)
        const rasterData = await image.readRasters({
          width: Math.min(width, 100),
          height: Math.min(height, 100),
        });

        setImageData({
          data: rasterData[0],
          width: Math.min(width, 100),
          height: Math.min(height, 100),
        });
      } catch (e) {
        console.warn("Could not read raster data:", e);
      }

      return {
        metadata,
        geoKeys,
        imageWidth: width,
        imageHeight: height,
        resolution,
        bbox,
        samples,
        bitsPerSample,
        compressionType,
        modelType: geoKeys?.GTModelTypeGeoKey,
        projectionType: geoKeys?.ProjectedCSTypeGeoKey,
        geographicType: geoKeys?.GeographicTypeGeoKey,
      };
    } catch (err) {
      console.error("Error extracting TIFF data:", err);
      throw err;
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);
      setFileName(file.name);
      setGeoraster(null);
      setTiffData(null);
      setImageData(null);

      // Read the file as an ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);

      // First parse with GeoTIFF.js
      try {
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        // Extract and store detailed TIFF data
        const extractedData = await extractTiffData(image);
        setTiffData(extractedData);

        // Then try parsing with geoblaze
        try {
          const parsedRaster = await geoblaze.parse(tiff);
          setGeoraster(parsedRaster);
          console.log("Successfully parsed with geoblaze:", parsedRaster);
        } catch (geoErr) {
          console.warn("Geoblaze parsing error (non-critical):", geoErr);
          setWarning(
            `Geoblaze couldn't fully parse this GeoTIFF. This may indicate the file lacks proper geospatial referencing. Basic metadata is still available.`
          );

          // If we have bbox info, try to create a minimal georaster object
          if (extractedData.bbox) {
            try {
              // Read full raster data
              const rasters = await image.readRasters();

              // Create a simplified georaster object with the data we have
              const simpleGeoraster = {
                imageWidth: extractedData.imageWidth,
                imageHeight: extractedData.imageHeight,
                pixelWidth:
                  (extractedData.bbox[2] - extractedData.bbox[0]) /
                  extractedData.imageWidth,
                pixelHeight:
                  (extractedData.bbox[3] - extractedData.bbox[1]) /
                  extractedData.imageHeight,
                xmin: extractedData.bbox[0],
                ymin: extractedData.bbox[1],
                xmax: extractedData.bbox[2],
                ymax: extractedData.bbox[3],
                values: rasters,
                noDataValue: 0, // Default, may not be accurate
                projection: "Unknown", // Default, may not be accurate
              };

              setGeoraster(simpleGeoraster);
              console.log("Created simplified georaster:", simpleGeoraster);
            } catch (e) {
              console.warn("Could not create simplified georaster:", e);
            }
          }
        }
      } catch (tiffErr) {
        setError(
          `This doesn't appear to be a valid TIFF file: ${tiffErr.message}`
        );
      }
    } catch (err) {
      console.error("Error processing GeoTIFF:", err);
      setError(`Failed to process GeoTIFF: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const renderDataPreview = () => {
    if (!imageData || !imageData.data) return null;

    // Create a simple visualization of the raster data
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const { width, height, data } = imageData;

    if (!ctx) return null;

    canvas.width = width;
    canvas.height = height;

    // Find data range for normalization
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }

    // Create image data
    const imgData = ctx.createImageData(width, height);
    const range = max - min;

    for (let i = 0; i < data.length; i++) {
      // Normalize value to 0-255 range
      const normalized =
        range === 0 ? 0 : Math.floor(((data[i] - min) / range) * 255);

      // Set RGB values (grayscale)
      imgData.data[i * 4] = normalized; // R
      imgData.data[i * 4 + 1] = normalized; // G
      imgData.data[i * 4 + 2] = normalized; // B
      imgData.data[i * 4 + 3] = 255; // Alpha
    }

    ctx.putImageData(imgData, 0, 0);

    return canvas.toDataURL();
  };

  const renderGeorasterDetails = () => {
    if (!tiffData && !georaster) return null;

    const dataPreviewUrl = renderDataPreview();

    return (
      <div style={{ marginTop: 20 }}>
        <Title level={4}>GeoTIFF Details - {fileName}</Title>

        {warning && (
          <Alert
            message="GeoTIFF Processing Warning"
            description={warning}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Collapse defaultActiveKey={["1", "6"]}>
          {dataPreviewUrl && (
            <Panel header="Data Preview (First Band)" key="6">
              <div style={{ textAlign: "center" }}>
                <img
                  src={dataPreviewUrl}
                  alt="GeoTIFF Data Preview"
                  style={{
                    maxWidth: "100%",
                    border: "1px solid #d9d9d9",
                    background:
                      "repeating-conic-gradient(#f5f5f5 0% 25%, white 0% 50%) 50% / 20px 20px",
                  }}
                />
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8 }}
                >
                  Preview of the first band data (grayscale normalized). This is
                  a simplified visualization and may not represent actual
                  colors.
                </Text>
              </div>
            </Panel>
          )}

          <Panel header="Basic Information" key="1">
            {tiffData && (
              <>
                <p>
                  <strong>Dimensions:</strong> {tiffData.imageWidth} x{" "}
                  {tiffData.imageHeight} pixels
                </p>
                <p>
                  <strong>Number of Bands:</strong> {tiffData.samples}
                </p>
                <p>
                  <strong>Bits per Sample:</strong>{" "}
                  {tiffData.bitsPerSample
                    ? tiffData.bitsPerSample.join(", ")
                    : "Unknown"}
                </p>
                <p>
                  <strong>Compression:</strong>{" "}
                  {tiffData.compressionType || "None/Unknown"}
                </p>
                <p>
                  <strong>Resolution:</strong>{" "}
                  {tiffData.resolution?.toString() || "Not available"}
                </p>
              </>
            )}
            {georaster && (
              <>
                <p>
                  <strong>No Data Value:</strong>{" "}
                  {georaster.noDataValue !== undefined
                    ? georaster.noDataValue
                    : "Not defined"}
                </p>
                <p>
                  <strong>Pixel Size:</strong>{" "}
                  {georaster.pixelWidth
                    ? `${georaster.pixelWidth} x ${georaster.pixelHeight} (projected units)`
                    : "Not available"}
                </p>
              </>
            )}
          </Panel>

          <Panel header="Spatial Reference" key="2">
            {tiffData?.bbox && (
              <>
                <p>
                  <strong>Bounding Box:</strong>
                </p>
                <ul>
                  <li>xmin: {tiffData.bbox[0]}</li>
                  <li>ymin: {tiffData.bbox[1]}</li>
                  <li>xmax: {tiffData.bbox[2]}</li>
                  <li>ymax: {tiffData.bbox[3]}</li>
                </ul>
              </>
            )}
            {tiffData?.geoKeys && (
              <>
                <p>
                  <strong>Model Type:</strong> {tiffData.modelType || "Unknown"}
                </p>
                <p>
                  <strong>Projection Type:</strong>{" "}
                  {tiffData.projectionType || "Unknown"}
                </p>
                <p>
                  <strong>Geographic Type:</strong>{" "}
                  {tiffData.geographicType || "Unknown"}
                </p>
              </>
            )}
            {georaster?.projection && (
              <p>
                <strong>Projection:</strong> {georaster.projection}
              </p>
            )}
            {!tiffData?.bbox && !georaster?.projection && (
              <p>
                <Text type="warning">
                  <WarningOutlined /> This file appears to be a standard TIFF
                  without proper geospatial referencing.
                </Text>
              </p>
            )}
          </Panel>

          <Panel header="Band Statistics" key="3">
            {georaster?.values && Array.isArray(georaster.values) ? (
              georaster.values.map((_, index) => {
                try {
                  const stats = geoblaze.stats(georaster, [, , index]);
                  return (
                    <div key={index}>
                      <p>
                        <strong>Band {index + 1}:</strong>
                      </p>
                      <ul>
                        <li>Min: {stats.min}</li>
                        <li>Max: {stats.max}</li>
                        <li>Mean: {stats.mean?.toFixed(4)}</li>
                        <li>Median: {stats.median?.toFixed(4)}</li>
                        <li>Mode: {stats.mode?.toFixed(4)}</li>
                        <li>Sum: {stats.sum?.toFixed(4)}</li>
                      </ul>
                      {index < georaster.values.length - 1 && <Divider />}
                    </div>
                  );
                } catch (e) {
                  return (
                    <div key={index}>
                      <p>
                        <strong>Band {index + 1}:</strong>
                      </p>
                      <Space>
                        <WarningOutlined style={{ color: "#faad14" }} />
                        <Text>
                          Could not compute statistics:{" "}
                          {e.message || "Unknown error"}
                        </Text>
                      </Space>
                      {index < georaster.values.length - 1 && <Divider />}
                    </div>
                  );
                }
              })
            ) : (
              <div>
                <p>
                  <WarningOutlined style={{ color: "#faad14" }} /> Band
                  statistics not available. Possible reasons:
                </p>
                <ul>
                  <li>File may not have proper geospatial referencing</li>
                  <li>
                    TIFF format may be non-standard or unsupported by geoblaze
                  </li>
                  <li>Data values may be in an unexpected format</li>
                </ul>
                <p>
                  Try using specialized GIS software like QGIS to check if this
                  is a valid GeoTIFF file.
                </p>
              </div>
            )}
          </Panel>

          <Panel header="GeoTIFF Metadata" key="4">
            <Paragraph>
              <pre style={{ maxHeight: "300px", overflow: "auto" }}>
                {JSON.stringify(
                  tiffData,
                  (key, value) => {
                    // Handle large arrays by truncating them
                    if (Array.isArray(value) && value.length > 100) {
                      return `Array of length ${value.length} (truncated for display)`;
                    }
                    // Handle TypedArrays
                    if (
                      value &&
                      value.buffer instanceof ArrayBuffer &&
                      value.BYTES_PER_ELEMENT
                    ) {
                      return `TypedArray of length ${value.length} (truncated for display)`;
                    }
                    return value;
                  },
                  2
                )}
              </pre>
            </Paragraph>
          </Panel>

          {georaster && (
            <Panel header="Georaster Structure" key="5">
              <Paragraph>
                <pre style={{ maxHeight: "300px", overflow: "auto" }}>
                  {JSON.stringify(
                    georaster,
                    (key, value) => {
                      // Handle large arrays by truncating them
                      if (Array.isArray(value) && value.length > 100) {
                        return `Array of length ${value.length} (truncated for display)`;
                      }
                      // Handle TypedArrays
                      if (
                        value &&
                        value.buffer instanceof ArrayBuffer &&
                        value.BYTES_PER_ELEMENT
                      ) {
                        return `TypedArray of length ${value.length} (truncated for display)`;
                      }
                      return value;
                    },
                    2
                  )}
                </pre>
              </Paragraph>
            </Panel>
          )}
        </Collapse>

        <Button
          style={{ marginTop: 16 }}
          onClick={() => {
            setGeoraster(null);
            setTiffData(null);
            setFileName("");
            setWarning(null);
            setImageData(null);
          }}
        >
          Clear
        </Button>
      </div>
    );
  };

  // Custom upload button
  const customUploadButton = (
    <Button icon={<UploadOutlined />} loading={loading}>
      Upload GeoTIFF
    </Button>
  );

  return (
    <Card title="GeoTIFF Explorer" style={{ width: "100%" }}>
      <Paragraph>
        Upload a GeoTIFF file to examine its structure and properties. This tool
        helps you understand the internal details of GeoTIFF files.
      </Paragraph>

      <Upload
        accept=".tif,.tiff"
        showUploadList={false}
        beforeUpload={(file) => {
          handleFileUpload(file);
          return false; // Prevent automatic upload
        }}
      >
        {customUploadButton}
      </Upload>

      {loading && <Spin style={{ marginTop: 16, display: "block" }} />}

      {error && (
        <div style={{ color: "red", marginTop: 16 }}>
          <InfoCircleOutlined /> {error}
        </div>
      )}

      {renderGeorasterDetails()}
    </Card>
  );
};

export default GeoTiffExplorer;
