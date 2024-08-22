import React, { useEffect } from "react";
import Highcharts, { Options } from "highcharts";

interface ChartProps {
  data: {
    id: string;
    name: string;
    propertyName: string;
    unit: string;
    data: { date: string; value: number }[];
  }[];
  filter: string | null;
  properties: string[];
}

const ChartComponent: React.FC<ChartProps> = ({ data, properties, filter }) => {
  const formatXAxisLabel = (value: number): string => {
    const date = new Date(value);
    switch (filter) {
      case "day":
        return Highcharts.dateFormat("%e. %b", date.getTime());
      case "week":
        return `${Highcharts.dateFormat(
          "%e. %b",
          date.getTime()
        )} - ${Highcharts.dateFormat(
          "%e. %b",
          date.getTime() + 6 * 24 * 3600 * 1000
        )}`;
      case "month":
        return Highcharts.dateFormat("%b '%y", date.getTime());
      case "year":
        return Highcharts.dateFormat("%Y", date.getTime());
      default:
        return Highcharts.dateFormat("%e. %b", date.getTime());
    }
  };

  const generateChartConfig = (
    filteredData: ChartProps["data"],
    filter: string | null
  ): Options => {
    const seriesData = filteredData.map(({ propertyName, data }) => ({
      type: "line", // Specify the type explicitly
      name: propertyName,
      data: data.map(
        ({ date, value }) =>
          [new Date(date).getTime(), value] as [number, number]
      ),
    }));

    return {
      title: { text: undefined },
      xAxis: {
        type: "datetime",
        labels: {
          formatter: function () {
            // Handle the case where `this.value` is not a number
            if (typeof this.value === "number") {
              return formatXAxisLabel(this.value);
            }
            return this.value as string;
          },
        },
      },
      yAxis: {
        title: {
          text: filteredData.length > 0 ? filteredData[0].unit : "Value",
        },
      },
      series: seriesData as Highcharts.SeriesOptionsType[], // Cast to the correct type
    };
  };

  useEffect(() => {
    const filteredData = data.filter((item) =>
      properties.includes(item.propertyName)
    );
    Highcharts.chart("container", generateChartConfig(filteredData, filter));
  }, [data, properties, filter]);

  return (
    <div id="container" style={{ height: "400px", marginTop: "50px" }}></div>
  );
};

export default ChartComponent;
