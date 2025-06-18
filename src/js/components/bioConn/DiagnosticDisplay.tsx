import React from "react";
import { Card, Alert, Table, Tag, Descriptions, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { GeoTiffAnalysis } from "./geoTiffAnalysis";

const { Text, Title } = Typography;

interface DiagnosticDisplayProps {
  originalAnalysis?: GeoTiffAnalysis;
  apiAnalysis?: GeoTiffAnalysis;
  comparisonResults?: {
    differences: string[];
    criticalIssues: string[];
  };
  visible?: boolean;
}

const DiagnosticDisplay: React.FC<DiagnosticDisplayProps> = ({
  originalAnalysis,
  apiAnalysis,
  comparisonResults,
  visible = false,
}) => {
  if (!visible || !originalAnalysis || !apiAnalysis) {
    return null;
  }

  const getComparisonData = () => {
    const properties = [
      {
        key: "geographicType",
        label: "Geographic Type (EPSG)",
        original: originalAnalysis.geographicType || "Missing",
        api: apiAnalysis.geographicType || "Missing",
        critical: true,
      },
      {
        key: "modelType",
        label: "Model Type",
        original: originalAnalysis.modelType || "Missing",
        api: apiAnalysis.modelType || "Missing",
        critical: false,
      },
      {
        key: "projectionType",
        label: "Projection Type",
        original: originalAnalysis.projectionType || "Missing",
        api: apiAnalysis.projectionType || "Missing",
        critical: false,
      },
      {
        key: "imageWidth",
        label: "Width (pixels)",
        original: originalAnalysis.imageWidth,
        api: apiAnalysis.imageWidth,
        critical: false,
      },
      {
        key: "imageHeight",
        label: "Height (pixels)",
        original: originalAnalysis.imageHeight,
        api: apiAnalysis.imageHeight,
        critical: false,
      },
      {
        key: "samples",
        label: "Number of Bands",
        original: originalAnalysis.samples,
        api: apiAnalysis.samples,
        critical: false,
      },
      {
        key: "bbox",
        label: "Bounding Box",
        original: originalAnalysis.bbox
          ? `[${originalAnalysis.bbox.join(", ")}]`
          : "Missing",
        api: apiAnalysis.bbox ? `[${apiAnalysis.bbox.join(", ")}]` : "Missing",
        critical: true,
      },
    ];

    return properties.map((prop) => {
      const originalStr = String(prop.original);
      const apiStr = String(prop.api);
      const match = originalStr === apiStr;

      return {
        ...prop,
        match,
        isMissing: originalStr === "Missing" || apiStr === "Missing",
      };
    });
  };

  const comparisonData = getComparisonData();
  const criticalMismatches = comparisonData.filter(
    (item) => !item.match && item.critical
  );
  const hasCriticalIssues =
    criticalMismatches.length > 0 ||
    (comparisonResults?.criticalIssues.length || 0) > 0;

  const columns = [
    {
      title: "Property",
      dataIndex: "label",
      key: "label",
      width: "25%",
      render: (text: string, record: any) => (
        <span>
          <strong>{text}</strong>
          {record.critical && (
            <Text type="danger" style={{ marginLeft: 4 }}>
              *
            </Text>
          )}
        </span>
      ),
    },
    {
      title: "Original Raster",
      dataIndex: "original",
      key: "original",
      width: "30%",
      render: (text: any, record: any) => (
        <Text
          type={
            record.isMissing && String(text) === "Missing"
              ? "danger"
              : undefined
          }
        >
          {String(text)}
        </Text>
      ),
    },
    {
      title: "API Response",
      dataIndex: "api",
      key: "api",
      width: "30%",
      render: (text: any, record: any) => (
        <Text
          type={
            record.isMissing && String(text) === "Missing"
              ? "danger"
              : undefined
          }
        >
          {String(text)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "match",
      key: "match",
      width: "15%",
      render: (match: boolean, record: any) => {
        if (record.isMissing) {
          return (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              Missing
            </Tag>
          );
        }

        return match ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Match
          </Tag>
        ) : (
          <Tag color="warning" icon={<WarningOutlined />}>
            Different
          </Tag>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <span>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          GeoTIFF Diagnostic Analysis
        </span>
      }
      style={{ margin: "16px 0" }}
    >
      {hasCriticalIssues && (
        <Alert
          message="Critical Issues Detected"
          description={
            <div>
              <p>
                The following critical issues may prevent proper geoblaze
                parsing:
              </p>
              <ul>
                {criticalMismatches.map((item) => (
                  <li key={item.key}>
                    <strong>{item.label}:</strong> Original has "{item.original}
                    ", API response has "{item.api}"
                  </li>
                ))}
                {comparisonResults?.criticalIssues.map((issue, index) => (
                  <li key={`critical-${index}`}>{issue}</li>
                ))}
              </ul>
              <p>
                <strong>Recommendation:</strong> The missing GeographicType
                (EPSG code like 32631) is particularly important for proper
                geospatial referencing. Consider adding this metadata to your
                API response.
              </p>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Title level={5}>Property Comparison</Title>
      <Table
        columns={columns}
        dataSource={comparisonData}
        pagination={false}
        size="small"
        rowKey="key"
        rowClassName={(record) => {
          if (record.isMissing) return "diagnostic-row-missing";
          if (!record.match && record.critical)
            return "diagnostic-row-critical";
          if (!record.match) return "diagnostic-row-different";
          return "";
        }}
      />

      <div style={{ marginTop: 16, fontSize: "12px", color: "#666" }}>
        <Text type="danger">*</Text> Critical properties for geoblaze parsing
      </div>

      {comparisonResults && (
        <>
          <Title level={5} style={{ marginTop: 16 }}>
            Missing Properties Analysis
          </Title>
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="Original Missing">
              {originalAnalysis.missingProperties.length > 0
                ? originalAnalysis.missingProperties.join(", ")
                : "None"}
            </Descriptions.Item>
            <Descriptions.Item label="API Response Missing">
              {apiAnalysis.missingProperties.length > 0
                ? apiAnalysis.missingProperties.join(", ")
                : "None"}
            </Descriptions.Item>
            <Descriptions.Item label="Original Has Geospatial Ref">
              {originalAnalysis.hasGeospatialReferencing ? "Yes" : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="API Response Has Geospatial Ref">
              {apiAnalysis.hasGeospatialReferencing ? "Yes" : "No"}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      <style jsx>{`
        .diagnostic-row-missing {
          background-color: #fff2f0;
        }
        .diagnostic-row-critical {
          background-color: #fff1f0;
          border-left: 4px solid #ff4d4f;
        }
        .diagnostic-row-different {
          background-color: #fffbe6;
        }
      `}</style>
    </Card>
  );
};

export default DiagnosticDisplay;
