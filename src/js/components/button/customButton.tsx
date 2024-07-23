import React from "react";
import { Button } from "antd";
import "./customButton.css"; // Import the CSS file

interface CustomButtonProps {
  text: string;
  onClick?: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({ text, onClick }) => {
  return (
    <Button
      type="primary"
      size="large"
      className="custom-button" // Apply custom class for styling
      onClick={onClick}
    >
      {text}
    </Button>
  );
};

export default CustomButton;
