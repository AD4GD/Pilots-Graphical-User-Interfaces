import React, { useState, useEffect } from "react";
import { Col, Row, Typography, Form, message } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { DataAvailibility } from "./dataAvailibility";
import Parse from "parse";

import { StepProgress } from "../stepProgress";
import { FileUpload, FILE_UPLOADED_EVENT } from "./fileUpload";
import { UploadForm } from "./uploadForm";
import { CustomButton } from "../../components/button";
import { importDataToCloud } from "./cloudFunctions";

const steps = ["Data", "Details", "Finalize"];

const DataUpload: React.FC = () => {
  const { Title } = Typography;
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Listen for the file upload event from FileUpload component
    const handleFileUploaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { file, fileContent } = customEvent.detail;
      setUploadedFile(file);
      setFileContent(fileContent);
    };

    window.addEventListener(FILE_UPLOADED_EVENT, handleFileUploaded);

    return () => {
      window.removeEventListener(FILE_UPLOADED_EVENT, handleFileUploaded);
    };
  }, []);

  const handleNext = async () => {
    if (currentStep === 0) {
      // Check if file is uploaded before proceeding
      if (!uploadedFile || !fileContent) {
        message.error("Please upload a file first!");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate form before proceeding
      try {
        await form.validateFields();
        setCurrentStep(2);
      } catch (error) {
        message.error("Please fill in all required fields!");
      }
    } else if (currentStep === 2) {
      // Submit data to cloud
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    // Reset form and state
    form.resetFields();
    setUploadedFile(null);
    setFileContent(null);
    setCurrentStep(0);
  };

  const handleAvailabilityChange = (isPublic: boolean) => {
    setIsPublic(isPublic);
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !fileContent) {
      message.error("No file has been uploaded");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get form values
      const formValues = await form.validateFields();

      // Call the Parse Cloud function to import the data
      const result = await Parse.Cloud.run("importLakeData", {
        csvData: fileContent,
        lakeName: formValues.lakeName,
        valueType: formValues.sensorName, // Using sensorName as valueType
        valueUnit: formValues.unitValue,
        source:
          formValues.dataType === "timeseries"
            ? "ad4gd_lakes"
            : "ad4gd_lakes_periodic",
      });

      if (result.success) {
        message.success(`Successfully uploaded data: ${result.message}`);
        // Reset form and go back to first step
        handleCancel();
      } else {
        message.error(`Failed to upload data: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Error uploading data:", error);
      message.error(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white",
        minHeight: "96vh",
      }}
    >
      <Row style={{ width: "100%", height: "80px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-widget"
          config={""}
        />
      </Row>

      <Row justify="center">
        <Col span={22}>
          <Title
            level={1}
            style={{
              fontWeight: "bold",
              marginBottom: "5rem",
              marginTop: "2rem",
            }}
          >
            Add Your Own Data
          </Title>
        </Col>
        <Col span={22} style={{ marginBottom: "2rem" }}>
          <StepProgress current={currentStep} steps={steps} />
        </Col>

        {currentStep === 0 && (
          <Col span={22}>
            <FileUpload />
            {uploadedFile && (
              <div style={{ marginTop: 16, color: "green" }}>
                File selected: {uploadedFile.name}
              </div>
            )}
          </Col>
        )}
        {currentStep === 1 && (
          <Col span={22}>
            <UploadForm form={form} />
          </Col>
        )}
        {currentStep === 2 && (
          <Col span={22}>
            <DataAvailibility onAvailabilityChange={handleAvailabilityChange} />
          </Col>
        )}
        <Col
          span={22}
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            marginTop: "5rem",
          }}
        >
          <CustomButton
            text="Back"
            onClick={handleBack}
            disabled={currentStep === 0}
          />
          <CustomButton
            text={currentStep === steps.length - 1 ? "Submit" : "Next"}
            onClick={handleNext}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <CustomButton
            text="Cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DataUpload;
