import React from "react";
import { Button } from "antd";
import "./customButton.css"; // Import the CSS file

interface CustomButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  text,
  onClick,
  disabled,
}) => {
  return (
    <Button
      type="primary"
      size="large"
      className="custom-button" // Apply custom class for styling
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </Button>
  );
};

export default CustomButton;
