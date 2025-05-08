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
<<<<<<< HEAD
  date: string; // Date in string format
=======
  date: string;
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
  value: number;
}

// Data structure for each sensor data
export interface SensorData {
<<<<<<< HEAD
  id: any;
  lake: string;
  propertyName: string;
  unit: string;
  data: DataPoint[];
=======
  propertyName: string;
  unit: string;
  data: DataPoint[];
  lake: string;
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
}

// Chart data format
export interface ChartData {
<<<<<<< HEAD
  type: "line" | "column"; // Chart type can either be 'line' or 'column'
  name: string;
  unit: string;
  data: [number, number][]; // Time-value pairs
}
=======
  type: string;
  name: string;
  unit: string;
  data: [number, number][];
}

>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
// ChartProps interface
export interface ChartProps {
  data: ChartData[]; // Data passed to the chart, of type ChartData
  filter: string; // Filter to decide date grouping (daily, weekly, etc.)
  properties: string[]; // Selected properties for the chart
<<<<<<< HEAD
=======
  multipleAxis: boolean; // Flag to indicate if it's a prediction graph
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
}
