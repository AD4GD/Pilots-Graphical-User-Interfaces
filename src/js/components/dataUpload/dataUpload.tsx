import React, { useState, useEffect } from "react";
import { Col, Row, Typography, Form, message } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { DataAvailibility } from "./dataAvailibility";
import Parse from "parse";

import StepProgress from "../stepProgress/stepProgress";
import { FileUpload, FILE_UPLOADED_EVENT } from "./fileUpload";
import { UploadForm, FormData } from "./uploadForm";
import { CustomButton } from "../../components/button";

const steps = ["Daten", "Details", "Abschließen"];

const DataUpload: React.FC = () => {
  const { Title } = Typography;
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add state to preserve form data between steps
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);

  // Update form with saved data when switching between steps
  useEffect(() => {
    if (savedFormData && currentStep === 2) {
      // When going back to step 1 and then forward to step 2, restore the saved form data
      form.setFieldsValue(savedFormData);
    }
  }, [currentStep, form, savedFormData]);
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
        message.error("Bitte laden Sie eine Datei hoch, bevor Sie fortfahren.");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate form before proceeding
      try {
        const values = await form.validateFields();
        setSavedFormData(values); // Save form data
        setCurrentStep(2);
      } catch (error) {
        message.error("Bitte füllen Sie alle erforderlichen Felder aus!");
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
    setSavedFormData(null);
    setCurrentStep(0);
  };

  const handleAvailabilityChange = (isPublic: boolean) => {
    setIsPublic(isPublic);
  };
  const handleSubmit = async () => {
    if (!uploadedFile || !fileContent) {
      message.error("Es wurde keine Datei hochgeladen");
      return;
    }

    try {
      setIsSubmitting(true);

      // Use the saved form values instead of revalidating, which prevents losing data
      const formValues = savedFormData || (await form.validateFields());
      if (!formValues || !formValues.lakeName) {
        message.error("Bitte füllen Sie alle erforderlichen Felder aus!");
        return;
      }
      // Determine the source based on data type and visibility
      let baseSource;
      if (formValues.dataType === "timeseries") {
        baseSource = isPublic ? "ad4gd_lakes" : "ad4gd_private";
      } else {
        baseSource = isPublic ? "ad4gd_periodic" : "ad4gd_periodic_private";
      }

      const params = {
        csvData: fileContent,
        lakeName: formValues.lakeName || "Unknown Lake",
        lakeId: formValues.lakeId, // Send the lake ID to the server
        valueType: formValues.valueType || "Generic Data",
        valueUnit: formValues.unitValue || "units",
        source: baseSource,
        isPublic: isPublic, // Add this to indicate whether data is public or private
      }; // Log the params being sent
      console.log("Sending params to Cloud function:", params);

      // Call the Parse Cloud function to import the data
      try {
        const result = await Parse.Cloud.run("importLakeData", params);

        if (result && result.success) {
          message.success(
            `Erfolgreich hochgeladene Daten: ${
              result.message || "Daten erfolgreich importiert!"
            }`
          );
          // Reset form and go back to first step
          handleCancel();
        } else {
          message.error(
            `Fehler beim Hochladen der Daten: ${
              result?.message || "Unbekannter Fehler"
            }`
          );
        }
      } catch (cloudError: any) {
        message.error(
          `Fehler: ${cloudError.message || "Unbekannter Serverfehler"}`
        );
      }
    } catch (error: any) {
      message.error(
        `Upload fehlgeschlagen: ${error.message || "Unbekannter Fehler"}`
      );
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
            Daten hochladen
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
                Datei ausgewählt: {uploadedFile.name}
              </div>
            )}
          </Col>
        )}
        {currentStep === 1 && (
          <Col span={22}>
            <UploadForm form={form} />
          </Col>
        )}{" "}
        {currentStep === 2 && (
          <Col span={22}>
            <DataAvailibility onAvailabilityChange={handleAvailabilityChange} />
            {savedFormData && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: "#f6ffed",
                  border: "1px solid #b7eb8f",
                }}
              >
                <h3>Formularübersicht:</h3>
                <p>
                  <strong>See Name:</strong> {savedFormData.lakeName}
                </p>
                <p>
                  <strong>Werttyp:</strong> {savedFormData.valueType}
                </p>
                <p>
                  <strong>Einheit Wert:</strong> {savedFormData.unitValue}
                </p>
                <p>
                  <strong>Datentyp:</strong> {savedFormData.dataType}
                </p>
                <p>
                  <strong>Sensor ID:</strong> {savedFormData.sensorId}
                </p>
              </div>
            )}
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
            text="Zurück"
            onClick={handleBack}
            disabled={currentStep === 0}
          />
          <CustomButton
            text={currentStep === steps.length - 1 ? "Einreichen" : "Weiter"}
            onClick={handleNext}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <CustomButton
            text="Abbrechen"
            onClick={handleCancel}
            disabled={isSubmitting}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DataUpload;
