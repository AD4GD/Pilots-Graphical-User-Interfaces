import React, { useState, useEffect } from "react";
import { Radio, Form, Row, Col } from "antd";

interface DataAvailibilityProps {
  onAvailabilityChange?: (isPublic: boolean) => void;
}

export const DataAvailibility: React.FC<DataAvailibilityProps> = ({
  onAvailabilityChange,
}) => {
  const [availability, setAvailability] = useState<string>("public");

  const handleAvailabilityChange = (e: any) => {
    const value = e.target.value;
    setAvailability(value);
    if (onAvailabilityChange) {
      onAvailabilityChange(value === "public");
    }
  };

  // Notify parent on initial render
  useEffect(() => {
    if (onAvailabilityChange) {
      onAvailabilityChange(availability === "public");
    }
  }, [onAvailabilityChange]);

  return (
    <Form
      layout="vertical"
      style={{
        backgroundColor: "#fafafa",
        padding: "16px",
        border: "1px dashed #d9d9d9",
      }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label={
              <span style={{ fontWeight: "600", fontSize: "16px" }}>
                Should the displayed data be available to all users, or only
                visible to you?
              </span>
            }
            name="dataAvailability"
          >
            <Radio.Group
              onChange={handleAvailabilityChange}
              value={availability}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Radio
                value="public"
                style={{ marginBottom: "8px", fontSize: "14px" }}
              >
                publicly visible
              </Radio>
              <Radio value="private" style={{ fontSize: "14px" }}>
                only I can see the data
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
