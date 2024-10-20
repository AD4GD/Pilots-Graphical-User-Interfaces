import React, { useEffect, useCallback, forwardRef } from "react";
import Highcharts, { Options } from "highcharts";
import "./chartComponent.css"; // Import the CSS file

interface ChartProps {
  data: {
    type: string;
    name: string;
    unit: string;
    data: [number, number][]; // Array of tuples for data points
  }[];
  filter: string | null;
  properties: string[];
}

const ChartComponent = forwardRef<HTMLDivElement, ChartProps>(
  ({ data, filter, properties }, ref) => {
    const formatXAxisLabel = useCallback(
      (value: number): string => {
        const date = new Date(value);
        switch (filter) {
          case "daily":
            return Highcharts.dateFormat("%e. %b", date.getTime());
          case "weekly":
            const endOfWeek = date.getTime() + 6 * 24 * 3600 * 1000;
            return `${Highcharts.dateFormat(
              "%e. %b",
              date.getTime()
            )} - ${Highcharts.dateFormat("%e. %b", endOfWeek)}`;
          case "monthly":
            return Highcharts.dateFormat("%b '%y", date.getTime());
          case "yearly":
            return Highcharts.dateFormat("%Y", date.getTime());
          default:
            return Highcharts.dateFormat("%e. %b", date.getTime());
        }
      },
      [filter]
    );

    const generateChartConfig = useCallback((): Options => {
      return {
        title: { text: undefined },
        xAxis: {
          type: "datetime",
          labels: {
            formatter: function () {
              return typeof this.value === "number"
                ? formatXAxisLabel(this.value)
                : this.value;
            },
            rotation: -45, // Optional: Rotates the labels for better readability
          },
          tickPixelInterval: 50, // Decrease this value to show more ticks
        },
        yAxis: properties.map((property, index) => ({
          title: {
            text: property,
          },
          opposite: index % 2 === 1, // Alternate sides for better visibility
        })),
        series: data.map((item, index) => ({
          ...item,
          yAxis: index % properties.length, // Assign series to the corresponding Y-axis
        })) as Highcharts.SeriesOptionsType[],
      };
    }, [data, formatXAxisLabel, properties]);

    useEffect(() => {
      if (filter && properties.length > 0) {
        const chart = Highcharts.chart("container", generateChartConfig());

        return () => {
          if (chart) {
            chart.destroy();
          }
        };
      }
    }, [generateChartConfig, filter]);

    if (!filter || properties.length === 0) {
      return (
        <div className="chart-placeholder-container">
          <p className="chart-placeholder-text">
            Please select sensor to display the chart.
          </p>
        </div>
      );
    }

    return (
      <div
        id="container"
        ref={ref}
        className="chart-container"
        style={{ padding: "2%" }}
      />
    );
  }
);

export default ChartComponent;
