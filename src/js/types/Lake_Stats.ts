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
  date: string;
  value: number;
}

// Data structure for each sensor data
export interface SensorData {
  propertyName: string;
  unit: string;
  data: DataPoint[];
  lake: string;
  id?: any;
}

// Chart data format
export interface ChartData {
  type: "line" | "column";
  name: string;
  unit: string;
  data: [number, number][]; // Time-value pairs
}

// ChartProps interface
export interface ChartProps {
  data: ChartData[]; // Data passed to the chart, of type ChartData
  filter: FilterType; // Filter to decide date grouping (daily, weekly, etc.)
  properties: string[]; // Selected properties for the chart
  multipleAxis: boolean; // Flag to indicate if it's a prediction graph
}
