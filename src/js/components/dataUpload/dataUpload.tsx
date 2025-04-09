import React, { useState } from "react";
import { Col, Row, Typography } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { DataAvailibility } from "./dataAvailibility";

import { StepProgress } from "../stepProgress";
import { FileUpload } from "./fileUpload";
import { UploadForm } from "./uploadForm";
import { CustomButton } from "../../components/button";

const steps = ["Data", "Details", "Finalize"];

const DataUpload: React.FC = () => {
  const { Title } = Typography;
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    setCurrentStep(0);
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
          </Col>
        )}
        {currentStep === 1 && (
          <Col span={22}>
            <UploadForm />
          </Col>
        )}
        {currentStep === 2 && (
          <Col span={22}>
            <DataAvailibility />
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
            text="Next"
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          />
          <CustomButton text="Cancel" onClick={handleCancel} />
        </Col>
      </Row>
    </div>
  );
};

export default DataUpload;
