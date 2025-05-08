import React, { useEffect, useCallback, forwardRef } from "react";
import Highcharts, { Options, SeriesOptionsType } from "highcharts";
import { ChartProps } from "../../types/Lake_Stats";
import "./chartComponent.css";

const ChartComponent = forwardRef<HTMLDivElement, ChartProps>(
  ({ data, filter, properties, multipleAxis }, ref) => {
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

    const barProperties = ["Precipitation", "Evaporation"];

    const generateChartConfig = useCallback((): Options => {
      const yAxes = multipleAxis
        ? properties.map((property, index) => {
            const matchingData = data.find((d) => d.name === property);
            const unit = matchingData?.unit || "";
            return {
              title: {
                text: `${property} (${unit})`,
              },
              opposite: index % 2 === 1,
            };
          })
        : [
            {
              title: {
                text: `${properties[0]} (${data[0]?.unit || ""})`,
              },
              opposite: false,
            },
          ];

      const series: SeriesOptionsType[] = data.map((item) => {
        const isBarChart = barProperties.includes(item.name);
        const yAxisIndex = multipleAxis
          ? properties.findIndex((p) => p === item.name)
          : 0;

        return {
          ...item,
          type: isBarChart ? "column" : "line",
          yAxis: yAxisIndex >= 0 ? yAxisIndex : 0, // fallback for derived series
        };
      });

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
            rotation: -45,
          },
          tickPixelInterval: 50,
        },
        yAxis: yAxes,
        series,
      };
    }, [data, formatXAxisLabel, properties, multipleAxis]);

    useEffect(() => {
      if (filter && properties.length > 0) {
        const chart = Highcharts.chart("container", generateChartConfig());
        return () => chart && chart.destroy();
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
