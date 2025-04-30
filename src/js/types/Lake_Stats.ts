export interface ConfigInterface {
  /**
   * Must be between 0 and 1
   */
  example?: number;
}

// Filter options for the dropdown
export type FilterType = "daily" | "weekly" | "monthly" | "yearly";

// Interface for FilterOption used in dropdown
export interface FilterOption {
  key: FilterType;
  label: string;
}

// Data structure for a single data point
export interface DataPoint {
  date: string; // Date in string format
  value: number;
}

// Data structure for each sensor data
export interface SensorData {
  id: any;
  lake: string;
  propertyName: string;
  unit: string;
  data: DataPoint[];
}

// Chart data format
export interface ChartData {
  type: "line" | "column"; // Chart type can either be 'line' or 'column'
  name: string;
  unit: string;
  data: [number, number][]; // Time-value pairs
}
// ChartProps interface
export interface ChartProps {
  data: ChartData[]; // Data passed to the chart, of type ChartData
  filter: string; // Filter to decide date grouping (daily, weekly, etc.)
  properties: string[]; // Selected properties for the chart
}
