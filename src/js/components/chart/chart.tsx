import React, { useEffect, useCallback } from "react";
import Highcharts, { Options } from "highcharts";
import "./chartComponent.css"; // Import the CSS file

interface ChartProps {
  data: {
    type: string;
    name: string;
    unit: string;
    data: [number, number][];
  }[];
  filter: string | null;
  properties: string[];
}

const ChartComponent: React.FC<ChartProps> = ({ data, filter }) => {
  const formatXAxisLabel = useCallback(
    (value: number): string => {
      const date = new Date(value);
      switch (filter) {
        case "day":
          return Highcharts.dateFormat("%e. %b", date.getTime());
        case "week":
          const endOfWeek = date.getTime() + 6 * 24 * 3600 * 1000;
          return `${Highcharts.dateFormat(
            "%e. %b",
            date.getTime()
          )} - ${Highcharts.dateFormat("%e. %b", endOfWeek)}`;
        case "month":
          return Highcharts.dateFormat("%b '%y", date.getTime());
        case "year":
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
      yAxis: {
        title: {
          text: data.length > 0 ? data[0].unit : "Value",
        },
      },
      series: data as Highcharts.SeriesOptionsType[],
    };
  }, [data, formatXAxisLabel]);

  useEffect(() => {
    if (filter) {
      const chart = Highcharts.chart("container", generateChartConfig());

      return () => {
        if (chart) {
          chart.destroy();
        }
      };
    }
  }, [generateChartConfig, filter]);

  if (!filter) {
    return (
      <div className="chart-placeholder-container">
        <p className="chart-placeholder-text">
          Please select a time filter to display the chart.
        </p>
      </div>
    );
  }

  return <div id="container" className="chart-container"></div>;
};

export default ChartComponent;
