import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { Button, Dropdown, Menu, Typography } from "antd";
import React, { useState } from "react";
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
  items,
  placeholder = "Select",
  selectedValue = null,
  handleClick,
}: SingleSelectDropdownProps<T>) => {
  const [open, setOpen] = useState(false);

  const handleDropdownVisibleChange = (flag: boolean) => {
    setOpen(flag);
  };

  if (!items || items.length === 0) {
    return <div>No items available</div>;
  }

  const displayText =
    selectedValue !== null
      ? items.find((item) => item.key === selectedValue)?.label || placeholder
      : placeholder;

  const menu = (
    <Menu>
      {items.map((item) => (
        <Menu.Item key={String(item.key)} onClick={() => handleClick(item.key)}>
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
      overlayClassName="custom-dropdown-overlay"
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
