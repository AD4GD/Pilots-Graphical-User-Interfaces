import React, { useEffect, useCallback, forwardRef } from "react";
import Highcharts, { Options, SeriesOptionsType } from "highcharts";
import { ChartProps } from "../../types/Lake_Stats";
import "./chartComponent.css";

const ChartComponent = forwardRef<HTMLDivElement, ChartProps>(
<<<<<<< HEAD
  ({ data, filter, properties }, ref) => {
    // Function to format the x-axis labels based on the filter (daily, weekly, etc.)
=======
  ({ data, filter, properties, multipleAxis }, ref) => {
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
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

<<<<<<< HEAD
    // Define an array for bar properties (e.g., Precipitation, Evaporation)
    const barProperties = ["Precipitation", "Evaporation"];

    // Generate chart configuration based on the passed data
    const generateChartConfig = useCallback((): Options => {
=======
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

>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
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
<<<<<<< HEAD
        yAxis: properties.map((property, index) => {
          const propertyData = data.find((item) => item.name === property);
          const unit = propertyData?.unit || ""; // Get unit for the current property
          return {
            title: {
              text: `${property} (${unit})`, // Use the correct unit for each property
            },
            opposite: index % 2 === 1,
          };
        }),
        series: data.map((item, index) => {
          // Determine if the current item should be a bar or line series
          const isBarChart = barProperties.includes(item.name);
          return {
            ...item,
            type: isBarChart ? "column" : "line", // Use 'column' for bar chart and 'line' for line chart
            yAxis: index % properties.length,
          };
        }) as SeriesOptionsType[],
      };
    }, [data, formatXAxisLabel, properties]);
=======
        yAxis: yAxes,
        series,
      };
    }, [data, formatXAxisLabel, properties, multipleAxis]);
>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505

    useEffect(() => {
      if (filter && properties.length > 0) {
        const chart = Highcharts.chart("container", generateChartConfig());
<<<<<<< HEAD
        return () => {
          if (chart) {
            chart.destroy();
          }
        };
      }
    }, [generateChartConfig, filter]);

    // If no filter or properties are selected, show a placeholder
=======
        return () => chart && chart.destroy();
      }
    }, [generateChartConfig, filter]);

>>>>>>> 19d3a8a4f69549848239d0ab8c0ce9fd84f13505
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
