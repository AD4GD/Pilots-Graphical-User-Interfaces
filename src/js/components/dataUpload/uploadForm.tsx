import React, { useState } from "react";
import { Form, Input, Select, Col, Row } from "antd";

export const UploadForm: React.FC = () => {
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
        <Col span={12}>
          <Form.Item
            label={
              <span style={{ fontWeight: "600" }}>
                Set a name for the added data
              </span>
            }
            name="dataName"
            rules={[
              {
                required: true,
                message: "Please enter the name of the added data!",
              },
            ]}
          >
            <Input placeholder="Enter data name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Lake Name</span>}
            name="lakeName"
            rules={[
              {
                required: true,
                message: "Please input the lake name!",
              },
            ]}
          >
            <Input placeholder="Enter lake name" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Sensor Name</span>}
            name="sensorName"
            rules={[
              {
                required: true,
                message: "Please input the sensor name!",
              },
            ]}
          >
            <Input placeholder="Enter sensor name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Unit Value</span>}
            name="unitValue"
            rules={[
              {
                required: true,
                message: "Please input the unit value!",
              },
            ]}
          >
            <Input placeholder="Enter unit value" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Data Type</span>}
            name="dataType"
            rules={[
              {
                required: true,
                message: "Please select the data type!",
              },
            ]}
          >
            <Select placeholder="Select data type">
              <Select.Option value="timeseries">Timeseries</Select.Option>
              <Select.Option value="periodic">Periodic</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
