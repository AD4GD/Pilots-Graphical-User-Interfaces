import React from "react";
import { Steps } from "antd";
import "./stepProgress.css"; // Import the custom CSS

const { Step } = Steps;

interface StepProgressProps {
  current: number;
  steps: string[];
}

const StepProgress: React.FC<StepProgressProps> = ({ current, steps }) => {
  return (
    <Steps current={current} className="custom-step">
      {steps.map((step, index) => (
        <Step key={index} title={step} />
      ))}
    </Steps>
  );
};

export default StepProgress;
