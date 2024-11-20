import React from "react";

interface MultiColorBarProps {
  minValue: number;
  maxValue: number;
  value: number;
}

const MultiColorBar: React.FC<MultiColorBarProps> = ({
  minValue,
  maxValue,
  value,
}) => {
  // Clamp the value within the min and max range
  const clampedValue = Math.max(minValue, Math.min(value, maxValue));

  // Calculate the percentage position of the arrow
  const percentage = ((clampedValue - minValue) / (maxValue - minValue)) * 100;

  // Gradient color stops
  interface GradientColor {
    stop: number;
    color: string;
  }

  const gradientColors: GradientColor[] = [
    { stop: 0, color: "#dc3545" }, // Red
    { stop: 30, color: "#f2d261" }, // Yellow
    { stop: 70, color: "#6fa053" }, // Green
  ];

  // Function to interpolate colors based on value
  const getBlendedColor = (
    percentage: number,
    colors: GradientColor[]
  ): string => {
    for (let i = 0; i < colors.length - 1; i++) {
      const start = colors[i];
      const end = colors[i + 1];

      if (percentage >= start.stop && percentage <= end.stop) {
        const ratio = (percentage - start.stop) / (end.stop - start.stop);
        return interpolateColor(start.color, end.color, ratio);
      }
    }
    return colors[colors.length - 1].color;
  };

  const interpolateColor = (
    color1: string,
    color2: string,
    ratio: number
  ): string => {
    const hex = (color: string) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 255;
    const g1 = (hex(color1) >> 8) & 255;
    const b1 = hex(color1) & 255;

    const r2 = (hex(color2) >> 16) & 255;
    const g2 = (hex(color2) >> 8) & 255;
    const b2 = hex(color2) & 255;

    const r = Math.round(r1 + ratio * (r2 - r1));
    const g = Math.round(g1 + ratio * (g2 - g1));
    const b = Math.round(b1 + ratio * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Calculate the arrow color based on the value
  const blendedColor = getBlendedColor(percentage, gradientColors);

  // Inline styles
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
  };

  const barStyle: React.CSSProperties = {
    width: "100%",
    height: "20px",
    borderRadius: "5px",
    background: `linear-gradient(to right, 
      #dc3545, #dc6145, #f2d261, #afd261, #6fa053)`,
    position: "relative",
    border: "1px solid #ccc",
  };

  const indicatorStyle: React.CSSProperties = {
    position: "absolute",
    top: "-15px",
    left: `${percentage}%`,
    width: "0",
    height: "0",
    borderLeft: "10px solid transparent",
    borderRight: "10px solid transparent",
    borderBottom: `15px solid ${blendedColor}`,
    transform: "translateX(-50%) rotate(180deg)",
    transition: "left 0.3s ease, border-bottom-color 0.3s ease",
  };

  const minMaxLabelStyle: React.CSSProperties = {
    position: "absolute",
    fontSize: "16px",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "5px",
    top: "100%",
  };

  return (
    <div style={containerStyle}>
      <div style={barStyle}></div>
      <div style={indicatorStyle}></div>
      <div style={minMaxLabelStyle}>
        <span>{minValue}</span>
        <span>{maxValue}</span>
      </div>
    </div>
  );
};

export default MultiColorBar;
