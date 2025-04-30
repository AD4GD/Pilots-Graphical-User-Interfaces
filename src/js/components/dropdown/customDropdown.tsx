import React, { useState } from "react";
import { CaretUpFilled, CaretDownFilled } from "@ant-design/icons";
import { Dropdown, Space, Typography, Button, Checkbox, Menu } from "antd";
import type { MenuProps } from "antd";
import "./customDropdown.css"; // Import the CSS file

interface CustomDropdownProps {
  items: {
    key: string;
    label: React.ReactNode;
  }[]; // Define the type for the items prop
  placeholder?: string; // Define the type for the placeholder prop
  selectedValues: string[];
  handleClick: (e: any) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  placeholder = "Select Sensor",
  selectedValues = [],
  handleClick,
}) => {
  const [open, setOpen] = useState(false);

  const handleDropdownVisibleChange = (flag: boolean) => {
    setOpen(flag);
  };

  if (!items || items.length === 0) {
    return <div>No items available</div>; // Display a message if no items are provided
  }

  const displayText =
    selectedValues.length > 0
      ? items
          .filter((item) => selectedValues.includes(item.key))
          .map((item) => item.label)
          .join(", ")
      : placeholder;

  // Handle text overflow for selected items
  const truncatedText =
    selectedValues.length > 3
      ? `${items
          .filter((item) => selectedValues.includes(item.key))
          .slice(0, 3)
          .map((item) => item.label)
          .join(", ")}... (${selectedValues.length} selected)`
      : displayText;

  const menu = (
    <Menu>
      {items.map((item) => (
        <Menu.Item key={item.key} onClick={handleClick}>
          <Checkbox
            checked={selectedValues.includes(item.key)}
            className="custom-checkbox"
          >
            {item.label}
          </Checkbox>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown
      overlay={menu}
      onOpenChange={handleDropdownVisibleChange}
      open={open}
      overlayClassName="custom-dropdown-overlay" // Apply custom class for dropdown menu
    >
      <Button className="custom-dropdown-button">
        <Typography.Text
          strong
          className={
            selectedValues.length > 0 ? "dropdown-text" : "dropdown-placeholder"
          }
          ellipsis
        >
          {truncatedText}
        </Typography.Text>
        <span className="arrow-icons">
          {open ? <CaretUpFilled /> : <CaretDownFilled />}
        </span>
      </Button>
    </Dropdown>
  );
};

export default CustomDropdown;
