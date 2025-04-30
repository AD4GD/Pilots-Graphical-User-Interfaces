import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { Button, Dropdown, Menu, Typography } from "antd";
import React, { useState } from "react";

import "./customDropdown.css"; // Import the CSS file
import { FilterType } from "../../types/Lake_Stats"; // Import the FilterType type

interface SingleSelectDropdownProps {
  items: {
    key: string;
    label: React.ReactNode;
  }[]; // Define the type for the items prop
  placeholder?: string; // Define the type for the placeholder prop
  selectedValue: string | null;
  handleClick: (key: FilterType) => void;
}

const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  items,
  placeholder = "Select",
  selectedValue = null,
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
    selectedValue !== null
      ? items.find((item) => item.key === selectedValue)?.label || placeholder
      : placeholder;

  const menu = (
    <Menu>
      {items.map((item) => (
        <Menu.Item key={item.key} onClick={() => handleClick(item.key)}>
          {item.label}
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
            selectedValue !== null ? "dropdown-text" : "dropdown-placeholder"
          }
          ellipsis
        >
          {displayText}
        </Typography.Text>
        <span className="arrow-icons">
          {open ? <CaretUpFilled /> : <CaretDownFilled />}
        </span>
      </Button>
    </Dropdown>
  );
};

export default SingleSelectDropdown;
