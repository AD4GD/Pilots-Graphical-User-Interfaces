import React, { useEffect } from "react";
import Highcharts from "highcharts";

interface ChartProps {
  data: {
    id: string;
    name: string;
    valueTypeName: string;
    unit: string;
    data: { date: string; value: number }[];
  }[];
  filter: "day" | "week" | "month" | "year";
}

const ChartComponent: React.FC<ChartProps> = ({ data, filter }) => {
  const generateChartConfig = (
    data: {
      id: string;
      name: string;
      valueTypeName: string;
      unit: string;
      data: { date: string; value: number }[];
    }[],
    filter: string
  ) => {
    const seriesData = data.map((item) => ({
      name: item.valueTypeName,
      data: item.data.map((point) => [
        new Date(point.date).getTime(),
        point.value,
      ]),
    }));

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
      series: seriesData,
    };
  };

  useEffect(() => {
    Highcharts.chart("container", generateChartConfig(data, filter));
  }, [data, filter]);

  return (
    <div id="container" style={{ height: "400px", marginTop: "50px" }}></div>
  );
};

export default ChartComponent;
