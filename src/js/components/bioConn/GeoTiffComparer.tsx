import React, { useState } from "react";
import {
  Upload,
  Button,
  Card,
  Spin,
  Collapse,
  Typography,
  Alert,
  Space,
  Row,
  Col,
  Table,
  Tag,
} from "antd";
import {
  UploadOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import geoblaze from "geoblaze";
import * as GeoTIFF from "geotiff";

const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;

interface TiffData {
  metadata: any;
  geoKeys: any;
  imageWidth: number;
  imageHeight: number;
  resolution: any;
  bbox: number[] | null;
  samples: number;
  bitsPerSample: any;
  compressionType: any;
  modelType: any;
  projectionType: any;
  geographicType: any;
}

interface FileData {
  fileName: string;
  loading: boolean;
  error: string | null;
  warning: string | null;
  georaster: any;
  tiffData: TiffData | null;
  imageData: any;
}

const GeoTiffComparer: React.FC = () => {
  const [file1, setFile1] = useState<FileData>({
    fileName: "",
    loading: false,
    error: null,
    warning: null,
    georaster: null,
    tiffData: null,
    imageData: null,
  });

  const [file2, setFile2] = useState<FileData>({
    fileName: "",
    loading: false,
    error: null,
    warning: null,
    georaster: null,
    tiffData: null,
    imageData: null,
  });

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

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const renderDataPreview = (imageData: any) => {
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

  const handleFileUpload = async (file: File, fileIndex: 1 | 2) => {
    const setFileData = fileIndex === 1 ? setFile1 : setFile2;

    try {
      setFileData((prev) => ({
        ...prev,
        loading: true,
        error: null,
        warning: null,
        fileName: file.name,
        georaster: null,
        tiffData: null,
        imageData: null,
      }));

      // Read the file as an ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);

      // First parse with GeoTIFF.js
      try {
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();

        // Extract and store detailed TIFF data
        const extractedData = await extractTiffData(image);

        // Try to read some raster data for visualization
        try {
          const rasterData = await image.readRasters({
            width: Math.min(extractedData.imageWidth, 100),
            height: Math.min(extractedData.imageHeight, 100),
          });

          const imageData = {
            data: rasterData[0],
            width: Math.min(extractedData.imageWidth, 100),
            height: Math.min(extractedData.imageHeight, 100),
          };

          setFileData((prev) => ({ ...prev, imageData }));
        } catch (e) {
          console.warn("Could not read raster data:", e);
        }

        setFileData((prev) => ({ ...prev, tiffData: extractedData }));

        // Then try parsing with geoblaze
        try {
          const parsedRaster = await geoblaze.parse(tiff);
          setFileData((prev) => ({ ...prev, georaster: parsedRaster }));
          console.log("Successfully parsed with geoblaze:", parsedRaster);
        } catch (geoErr) {
          console.warn("Geoblaze parsing error (non-critical):", geoErr);
          setFileData((prev) => ({
            ...prev,
            warning: `Geoblaze couldn't fully parse this GeoTIFF. This may indicate the file lacks proper geospatial referencing. Basic metadata is still available.`,
          }));

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

              setFileData((prev) => ({ ...prev, georaster: simpleGeoraster }));
              console.log("Created simplified georaster:", simpleGeoraster);
            } catch (e) {
              console.warn("Could not create simplified georaster:", e);
            }
          }
        }
      } catch (tiffErr) {
        setFileData((prev) => ({
          ...prev,
          error: `This doesn't appear to be a valid TIFF file: ${tiffErr.message}`,
        }));
      }
    } catch (err) {
      console.error("Error processing GeoTIFF:", err);
      setFileData((prev) => ({
        ...prev,
        error: `Failed to process GeoTIFF: ${err.message || "Unknown error"}`,
      }));
    } finally {
      setFileData((prev) => ({ ...prev, loading: false }));
    }
  };

  const getComparisonData = () => {
    if (!file1.tiffData || !file2.tiffData) return [];

    const properties = [
      {
        key: "fileName",
        label: "File Name",
        file1: file1.fileName,
        file2: file2.fileName,
      },
      {
        key: "imageWidth",
        label: "Width (pixels)",
        file1: file1.tiffData.imageWidth,
        file2: file2.tiffData.imageWidth,
      },
      {
        key: "imageHeight",
        label: "Height (pixels)",
        file1: file1.tiffData.imageHeight,
        file2: file2.tiffData.imageHeight,
      },
      {
        key: "samples",
        label: "Number of Bands",
        file1: file1.tiffData.samples,
        file2: file2.tiffData.samples,
      },
      {
        key: "bitsPerSample",
        label: "Bits per Sample",
        file1: file1.tiffData.bitsPerSample?.join(", ") || "Unknown",
        file2: file2.tiffData.bitsPerSample?.join(", ") || "Unknown",
      },
      {
        key: "compressionType",
        label: "Compression",
        file1: file1.tiffData.compressionType || "None/Unknown",
        file2: file2.tiffData.compressionType || "None/Unknown",
      },
      {
        key: "resolution",
        label: "Resolution",
        file1: file1.tiffData.resolution?.toString() || "Not available",
        file2: file2.tiffData.resolution?.toString() || "Not available",
      },
      {
        key: "modelType",
        label: "Model Type",
        file1: file1.tiffData.modelType || "Unknown",
        file2: file2.tiffData.modelType || "Unknown",
      },
      {
        key: "projectionType",
        label: "Projection Type",
        file1: file1.tiffData.projectionType || "Unknown",
        file2: file2.tiffData.projectionType || "Unknown",
      },
      {
        key: "geographicType",
        label: "Geographic Type",
        file1: file1.tiffData.geographicType || "Unknown",
        file2: file2.tiffData.geographicType || "Unknown",
      },
      {
        key: "bbox",
        label: "Bounding Box",
        file1: file1.tiffData.bbox?.join(", ") || "Not available",
        file2: file2.tiffData.bbox?.join(", ") || "Not available",
      },
    ];

    if (file1.georaster && file2.georaster) {
      properties.push(
        {
          key: "noDataValue",
          label: "No Data Value",
          file1: file1.georaster.noDataValue ?? "Not defined",
          file2: file2.georaster.noDataValue ?? "Not defined",
        },
        {
          key: "pixelWidth",
          label: "Pixel Width",
          file1: file1.georaster.pixelWidth || "Not available",
          file2: file2.georaster.pixelWidth || "Not available",
        },
        {
          key: "pixelHeight",
          label: "Pixel Height",
          file1: file1.georaster.pixelHeight || "Not available",
          file2: file2.georaster.pixelHeight || "Not available",
        },
        {
          key: "projection",
          label: "Projection",
          file1: file1.georaster.projection || "Unknown",
          file2: file2.georaster.projection || "Unknown",
        }
      );
    }

    return properties.map((prop) => ({
      ...prop,
      match: prop.file1 === prop.file2,
    }));
  };

  const renderComparisonTable = () => {
    const comparisonData = getComparisonData();

    const columns = [
      {
        title: "Property",
        dataIndex: "label",
        key: "label",
        width: "25%",
        render: (text: string) => <strong>{text}</strong>,
      },
      {
        title: file1.fileName || "File 1",
        dataIndex: "file1",
        key: "file1",
        width: "30%",
        render: (text: any) => <Text>{String(text)}</Text>,
      },
      {
        title: file2.fileName || "File 2",
        dataIndex: "file2",
        key: "file2",
        width: "30%",
        render: (text: any) => <Text>{String(text)}</Text>,
      },
      {
        title: "Match",
        dataIndex: "match",
        key: "match",
        width: "15%",
        render: (match: boolean) =>
          match ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Match
            </Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              Different
            </Tag>
          ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={comparisonData}
        pagination={false}
        size="small"
        rowKey="key"
        rowClassName={(record) =>
          record.match ? "" : "comparison-row-different"
        }
        style={{ marginTop: 16 }}
      />
    );
  };

  const renderFileCard = (fileData: FileData, fileIndex: 1 | 2) => {
    const title = `File ${fileIndex}${
      fileData.fileName ? `: ${fileData.fileName}` : ""
    }`;

    return (
      <Card
        title={title}
        size="small"
        extra={
          <Upload
            accept=".tif,.tiff"
            showUploadList={false}
            beforeUpload={(file) => {
              handleFileUpload(file, fileIndex);
              return false;
            }}
          >
            <Button
              icon={<UploadOutlined />}
              loading={fileData.loading}
              size="small"
            >
              Upload
            </Button>
          </Upload>
        }
      >
        {fileData.loading && <Spin />}

        {fileData.error && (
          <Alert
            message="Error"
            description={fileData.error}
            type="error"
            showIcon
            size="small"
          />
        )}

        {fileData.warning && (
          <Alert
            message="Warning"
            description={fileData.warning}
            type="warning"
            showIcon
            size="small"
            style={{ marginTop: 8 }}
          />
        )}

        {fileData.imageData && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <img
              src={renderDataPreview(fileData.imageData)}
              alt={`${title} Preview`}
              style={{
                maxWidth: "100%",
                maxHeight: "150px",
                border: "1px solid #d9d9d9",
                background:
                  "repeating-conic-gradient(#f5f5f5 0% 25%, white 0% 50%) 50% / 20px 20px",
              }}
            />
            <Text
              type="secondary"
              style={{ display: "block", fontSize: "12px" }}
            >
              Data Preview
            </Text>
          </div>
        )}

        {!fileData.fileName && !fileData.loading && (
          <div
            style={{ textAlign: "center", padding: "20px 0", color: "#999" }}
          >
            <UploadOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
            <div>Click Upload to select a GeoTIFF file</div>
          </div>
        )}
      </Card>
    );
  };

  const clearAll = () => {
    setFile1({
      fileName: "",
      loading: false,
      error: null,
      warning: null,
      georaster: null,
      tiffData: null,
      imageData: null,
    });
    setFile2({
      fileName: "",
      loading: false,
      error: null,
      warning: null,
      georaster: null,
      tiffData: null,
      imageData: null,
    });
  };

  const hasValidFiles = file1.tiffData && file2.tiffData;

  return (
    <div style={{ width: "100%" }}>
      <Card
        title={
          <Space>
            <SwapOutlined />
            GeoTIFF Comparer
          </Space>
        }
      >
        <Paragraph>
          Upload two GeoTIFF files to compare their data structures, properties,
          and metadata side by side.
        </Paragraph>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>{renderFileCard(file1, 1)}</Col>
          <Col span={12}>{renderFileCard(file2, 2)}</Col>
        </Row>

        {hasValidFiles && (
          <Card title="Comparison Results" style={{ marginTop: 16 }}>
            {renderComparisonTable()}

            <div style={{ marginTop: 16 }}>
              <Button onClick={clearAll}>Clear All Files</Button>
            </div>
          </Card>
        )}

        {hasValidFiles && (
          <Collapse style={{ marginTop: 16 }}>
            <Panel header="Detailed Metadata Comparison" key="metadata">
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}>{file1.fileName}</Title>
                  <Paragraph>
                    <pre
                      style={{
                        maxHeight: "400px",
                        overflow: "auto",
                        fontSize: "12px",
                      }}
                    >
                      {JSON.stringify(
                        file1.tiffData,
                        (key, value) => {
                          if (Array.isArray(value) && value.length > 100) {
                            return `Array of length ${value.length} (truncated)`;
                          }
                          if (
                            value &&
                            value.buffer instanceof ArrayBuffer &&
                            value.BYTES_PER_ELEMENT
                          ) {
                            return `TypedArray of length ${value.length} (truncated)`;
                          }
                          return value;
                        },
                        2
                      )}
                    </pre>
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Title level={5}>{file2.fileName}</Title>
                  <Paragraph>
                    <pre
                      style={{
                        maxHeight: "400px",
                        overflow: "auto",
                        fontSize: "12px",
                      }}
                    >
                      {JSON.stringify(
                        file2.tiffData,
                        (key, value) => {
                          if (Array.isArray(value) && value.length > 100) {
                            return `Array of length ${value.length} (truncated)`;
                          }
                          if (
                            value &&
                            value.buffer instanceof ArrayBuffer &&
                            value.BYTES_PER_ELEMENT
                          ) {
                            return `TypedArray of length ${value.length} (truncated)`;
                          }
                          return value;
                        },
                        2
                      )}
                    </pre>
                  </Paragraph>
                </Col>
              </Row>
            </Panel>

            {file1.georaster && file2.georaster && (
              <Panel header="Georaster Structure Comparison" key="georaster">
                <Row gutter={16}>
                  <Col span={12}>
                    <Title level={5}>{file1.fileName} - Georaster</Title>
                    <Paragraph>
                      <pre
                        style={{
                          maxHeight: "400px",
                          overflow: "auto",
                          fontSize: "12px",
                        }}
                      >
                        {JSON.stringify(
                          file1.georaster,
                          (key, value) => {
                            if (Array.isArray(value) && value.length > 100) {
                              return `Array of length ${value.length} (truncated)`;
                            }
                            if (
                              value &&
                              value.buffer instanceof ArrayBuffer &&
                              value.BYTES_PER_ELEMENT
                            ) {
                              return `TypedArray of length ${value.length} (truncated)`;
                            }
                            return value;
                          },
                          2
                        )}
                      </pre>
                    </Paragraph>
                  </Col>
                  <Col span={12}>
                    <Title level={5}>{file2.fileName} - Georaster</Title>
                    <Paragraph>
                      <pre
                        style={{
                          maxHeight: "400px",
                          overflow: "auto",
                          fontSize: "12px",
                        }}
                      >
                        {JSON.stringify(
                          file2.georaster,
                          (key, value) => {
                            if (Array.isArray(value) && value.length > 100) {
                              return `Array of length ${value.length} (truncated)`;
                            }
                            if (
                              value &&
                              value.buffer instanceof ArrayBuffer &&
                              value.BYTES_PER_ELEMENT
                            ) {
                              return `TypedArray of length ${value.length} (truncated)`;
                            }
                            return value;
                          },
                          2
                        )}
                      </pre>
                    </Paragraph>
                  </Col>
                </Row>
              </Panel>
            )}
          </Collapse>
        )}
      </Card>

      <style jsx>{`
        .comparison-row-different {
          background-color: #fff2f0;
        }
      `}</style>
    </div>
  );
};

export default GeoTiffComparer;
