import React, { useEffect } from "react";
import Highcharts from "highcharts";

interface ChartProps {
  data: { timestamp: number; [key: string]: number }[];
  properties: string[];
  filter: "day" | "week" | "month" | "year";
}

const ChartComponent: React.FC<ChartProps> = ({ data, properties, filter }) => {
  const generateChartConfig = (
    data: { timestamp: number; [key: string]: number }[],
    properties: string[],
    filter: "day" | "week" | "month" | "year"
  ) => {
    return {
      title: {
        text: null,
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            if (filter === "day") {
              return Highcharts.dateFormat("%e. %b", this.value);
            } else if (filter === "week") {
              return (
                Highcharts.dateFormat("%e. %b", this.value) +
                " - " +
                Highcharts.dateFormat(
                  "%e. %b",
                  this.value + 6 * 24 * 3600 * 1000
                )
              );
            } else if (filter === "month") {
              return Highcharts.dateFormat("%b '%y", this.value);
            } else if (filter === "year") {
              return Highcharts.dateFormat("%Y", this.value);
            } else {
              return Highcharts.dateFormat("%e. %b", this.value);
            }
          },
        },
      },
      yAxis: {
        title: {
          text: "Value",
        },
      },
      series: properties.map((property) => ({
        name: property,
        data: data.map((item) => [item.timestamp, item[property]]),
      })),
    };
  };

  useEffect(() => {
    Highcharts.chart(
      "container",
      generateChartConfig(data, properties, filter)
    );
  }, [data, properties, filter]);

  return (
    <div id="container" style={{ height: "400px", marginTop: "50px" }}></div>
  );
};

export default ChartComponent;
