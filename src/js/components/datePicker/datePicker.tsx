import React from "react";
import { DatePicker } from "antd";
import type { Moment } from "moment";
import momentGenerateConfig from "rc-picker/lib/generate/moment";
import "./datePicker.css"; // Import custom CSS styles

// Custom DatePicker using Moment
const MyDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

interface MyDatePickerProps {
  onDateChange: (timestamp: number | null) => void; // Prop to pass Unix timestamp to parent
  placeholder: string; // Placeholder prop for the DatePicker
}

const MyDatePickerComponent: React.FC<MyDatePickerProps> = ({
  onDateChange,
  placeholder,
}) => {
  // Function to handle date change
  const onChange = (date: Moment | null) => {
    if (date) {
      onDateChange(date.valueOf()); // Send Unix timestamp in milliseconds to the parent
    } else {
      onDateChange(null); // No date selected
    }
  };

  return (
    <MyDatePicker
      onChange={onChange}
      placeholder={placeholder}
      className="custom-datepicker" // Apply custom styles directly here
      style={{ width: "100%" }} // Ensure full width
    />
  );
};

export default MyDatePickerComponent;
