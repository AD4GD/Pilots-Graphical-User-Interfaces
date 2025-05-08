import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { Button, Dropdown, Menu, Typography } from "antd";
import React, { useState } from "react";
<<<<<<< HEAD

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
=======
import "./customDropdown.css";

interface SingleSelectDropdownProps<T = string> {
  items: {
    key: T;
    label: React.ReactNode;
  }[];
  placeholder?: string;
  selectedValue: T | null;
  handleClick: (key: T) => void;
}

const SingleSelectDropdown = <T extends string | number>({
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
  items,
  placeholder = "Select",
  selectedValue = null,
  handleClick,
<<<<<<< HEAD
}) => {
=======
}: SingleSelectDropdownProps<T>) => {
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
  const [open, setOpen] = useState(false);

  const handleDropdownVisibleChange = (flag: boolean) => {
    setOpen(flag);
  };

  if (!items || items.length === 0) {
<<<<<<< HEAD
    return <div>No items available</div>; // Display a message if no items are provided
=======
    return <div>No items available</div>;
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
  }

  const displayText =
    selectedValue !== null
      ? items.find((item) => item.key === selectedValue)?.label || placeholder
      : placeholder;

  const menu = (
    <Menu>
      {items.map((item) => (
<<<<<<< HEAD
        <Menu.Item key={item.key} onClick={() => handleClick(item.key)}>
=======
        <Menu.Item key={String(item.key)} onClick={() => handleClick(item.key)}>
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
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
<<<<<<< HEAD
      overlayClassName="custom-dropdown-overlay" // Apply custom class for dropdown menu
=======
      overlayClassName="custom-dropdown-overlay"
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
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
