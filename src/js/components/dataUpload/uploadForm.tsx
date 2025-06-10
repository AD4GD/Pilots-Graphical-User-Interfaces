import React, { useEffect } from "react";
import { Form, Input, Select, Col, Row, Spin, FormInstance } from "antd";
import { useLakeGeographies } from "../../hooks/useLakeGeographies";

export interface FormData {
  lakeName: string;
  valueType: string;
  unitValue: string;
  dataType: string;
  sensorName?: string;
  sensorId?: string;
}

interface UploadFormProps {
  onFormValuesChange?: (allValues: FormData) => void;
  form: FormInstance;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  onFormValuesChange,
  form,
}) => {
  const { geographies, loading, error } = useLakeGeographies();

  // Update sensor name and ID whenever lake name or value type changes
  useEffect(() => {
    // Initial update if both fields already have values
    const lakeName = form.getFieldValue("lakeName");
    const valueType = form.getFieldValue("valueType");

    if (lakeName && valueType) {
      updateSensorInfo(lakeName, valueType);
    }
  }, [form]);
  // Function to update the sensorName and sensorId fields
  const updateSensorInfo = (lakeName: string, valueType: string) => {
    if (lakeName && valueType) {
      // Create sensor name in the format: LakeName ValueType
      const sensorName = `${lakeName} ${valueType}`;

      // Format value type - remove spaces
      const formattedValueType = valueType.toLowerCase().replace(/\s+/g, "");

      // Create the sensorId
      let sensorId;

      // Special case handling for Großglienicker See
      if (lakeName === "Großglienicker See") {
        sensorId = `sensor_großglienikersee_${formattedValueType}`;
      } else {
        // Normal case - convert lake name to lowercase and remove all spaces
        const formattedLakeName = lakeName.toLowerCase().replace(/\s+/g, "");
        sensorId = `sensor_${formattedLakeName}_${formattedValueType}`;
      }

      // Debug output
      console.log("Lake Name:", lakeName);
      console.log("Value Type:", valueType);
      console.log("Generated Sensor ID:", sensorId);

      form.setFieldValue("sensorName", sensorName);
      form.setFieldValue("sensorId", sensorId);

      // Get all form values and include the updated sensorName and sensorId
      if (onFormValuesChange) {
        const allValues = form.getFieldsValue(true);
        onFormValuesChange({ ...allValues, sensorName, sensorId });
      }
    }
  }; // Handle form field changes to update the sensorName and sensorId
  const handleFieldChange = (changedValues: any, allValues: any) => {
    console.log(
      "Form values changed:",
      changedValues,
      "All values:",
      allValues
    );

    // Only update sensorName and sensorId if both lakeName and valueType are present
    if (allValues.lakeName && allValues.valueType) {
      updateSensorInfo(allValues.lakeName, allValues.valueType);
    }

    // Call the parent's callback with all values
    if (onFormValuesChange) {
      onFormValuesChange(allValues as FormData);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleFieldChange}
      style={{
        backgroundColor: "#fafafa",
        padding: "16px",
        border: "1px dashed #d9d9d9",
      }}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Lake Name</span>}
            name="lakeName"
            rules={[
              {
                required: true,
                message: "Please select a lake!",
              },
            ]}
          >
            {loading ? (
              <Spin size="small" />
            ) : error ? (
              <Input placeholder="Error loading lakes, enter name manually" />
            ) : (
              <Select
                placeholder="Select a lake"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label?.toString().toLowerCase() ?? "").includes(
                    input.toLowerCase()
                  )
                }
                options={
                  geographies?.map((lake) => ({
                    value: lake.label, // The actual value stored in form
                    label: lake.label, // Display value
                  })) || []
                }
                onChange={(value) => {
                  // Update the form values directly when selection changes
                  console.log("Lake selected:", value);
                  form.setFieldValue("lakeName", value);

                  // Only update sensor info if value type is also present
                  const valueType = form.getFieldValue("valueType");
                  if (value && valueType) {
                    updateSensorInfo(value, valueType);
                  }
                }}
              />
            )}{" "}
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={<span style={{ fontWeight: "600" }}>Value Type</span>}
            name="valueType"
            rules={[
              {
                required: true,
                message: "Please input the value type!",
              },
            ]}
          >
            <Input placeholder="Enter value type (e.g., Temperature, Water Level)" />
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
            <Input placeholder="Enter unit value (e.g., °C, mm)" />
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
            initialValue="timeseries"
          >
            <Select placeholder="Select data type">
              <Select.Option value="timeseries">Timeseries</Select.Option>
              <Select.Option value="periodic">Periodic</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={
              <span style={{ fontWeight: "600" }}>Generated Sensor Name</span>
            }
            name="sensorName"
            tooltip="This is automatically generated from lake name and value type"
          >
            <Input
              disabled
              style={{ backgroundColor: "#f5f5f5", color: "#666" }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label={
              <span style={{ fontWeight: "600" }}>Generated Sensor ID</span>
            }
            name="sensorId"
            tooltip="This ID is automatically generated from lake name and value type"
          >
            <Input
              disabled
              style={{ backgroundColor: "#f5f5f5", color: "#666" }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};
