import React, { useEffect, useCallback, forwardRef, useMemo } from "react";
import Highcharts, { Options, SeriesOptionsType } from "highcharts";
import { ChartProps } from "../../types/Lake_Stats";
import "./chartComponent.css";

const ChartComponent = forwardRef<HTMLDivElement, ChartProps>(
  ({ data, filter, properties, multipleAxis }, ref) => {
    // Generate a unique container ID per chart instance
    const containerId = useMemo(
      () => `chart-${Math.random().toString(36).substr(2, 9)}`,
      []
    );

    // Defensive copy of properties to avoid mutation issues
    const safeProperties = useMemo(() => [...properties], [properties]);

    const formatXAxisLabel = useCallback(
      (value: number): string => {
        const date = new Date(value);
        switch (filter) {
          case "daily":
            return Highcharts.dateFormat("%e. %b", date.getTime());
          case "weekly": {
            const endOfWeek = date.getTime() + 6 * 24 * 3600 * 1000;
            return `${Highcharts.dateFormat(
              "%e. %b",
              date.getTime()
            )} - ${Highcharts.dateFormat("%e. %b", endOfWeek)}`;
          }
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
        ? safeProperties.map((property, index) => {
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
                text: `${safeProperties[0]} (${data[0]?.unit || ""})`,
              },
              opposite: false,
            },
          ];

      const series: SeriesOptionsType[] = data.map((item) => {
        const isBarChart = barProperties.includes(item.name);
        const yAxisIndex = multipleAxis
          ? safeProperties.findIndex((p) => p === item.name)
          : 0;

        return {
          ...item,
          type: isBarChart ? "column" : "line",
          yAxis: yAxisIndex >= 0 ? yAxisIndex : 0, // fallback
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
    }, [data, formatXAxisLabel, safeProperties, multipleAxis]);

    useEffect(() => {
      if (filter && safeProperties.length > 0) {
        const chart = Highcharts.chart(containerId, generateChartConfig());
        return () => chart && chart.destroy();
      }
    }, [generateChartConfig, filter, containerId, safeProperties.length]);

    if (!filter || safeProperties.length === 0) {
      return (
        <div className="chart-placeholder-container">
          <p className="chart-placeholder-text">
            Bitte wählen Sie einen Filter und mindestens eine Eigenschaft aus,
            um das Diagramm anzuzeigen.
          </p>
        </div>
      );
    }

    return (
      <div
        id={containerId}
        ref={ref}
        className="chart-container"
        style={{ padding: "2%" }}
      />
    );
  }
);

export default ChartComponent;
