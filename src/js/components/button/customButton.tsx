import React from "react";
import { Button } from "antd";
import "./customButton.css";

interface CustomButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  text,
  onClick,
  disabled,
  loading,
}) => {
  return (
    <Button
      type="primary"
      size="large"
      className="custom-button"      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      loading={loading}
    >
      {text}
    </Button>
  );
};

export default CustomButton;
