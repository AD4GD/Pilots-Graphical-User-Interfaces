import React, { useEffect, useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Row, Typography } from "antd";
import { useDataService } from "@opendash/plugin-timeseries";

import {
  SingleSelectDropdown,
  CustomDropdown,
} from "../../components/dropdown";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import { ConfigInterface } from "./types";

interface Data {
  id: any;
  lake: any;
  propertyName: any;
  unit: any;
  data: {
    unit: string;
    date: string;
    value: number;
  }[];
}

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();
    context["setLoading"](false);
    const DataService = useDataService();
    const items = context.useItemDimensionConfig();
    const chartRef = useRef(null);

    // State variables
    const [data, setData] = useState<Data[]>([]);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Fetch properties and transform data
    const fetchProperties = (items: any[]) => {
      return items.map((item: any[]) => {
        const { valueTypes } = item[0];
        const key = valueTypes[0].name;
        const label = valueTypes[0].name;

        return { key, label };
      });
    };

    const transformData = (data: any[]) => {
      return data.map((item: any[]) => {
        const { id, name: lake, valueTypes } = item[0];
        const propertyName = valueTypes[0].name;
        const unit = valueTypes[0].unit;
        const data = item[2];

        return { id, lake, propertyName, unit, data };
      });
    };

    const aggregateData = (
      data: { date: string; value: number }[],
      filter: string | null
    ) => {
      const aggregated: Record<string, { sum: number; count: number }> = {};

      data.forEach(({ date, value }) => {
        const dateObj = new Date(date);
        let key: string;

        switch (filter) {
          case "week":
            const startOfWeek = new Date(dateObj);
            startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
            key = startOfWeek.toISOString().split("T")[0];
            break;
          case "month":
            key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`;
            break;
          case "year":
            key = dateObj.getFullYear().toString();
            break;
          case "day":
          default:
            key = dateObj.toISOString().split("T")[0];
        }

        if (!aggregated[key]) {
          aggregated[key] = { sum: 0, count: 0 };
        }

        aggregated[key].sum += value;
        aggregated[key].count += 1;
      });

      return Object.entries(aggregated).map(([key, { sum, count }]) => ({
        date: key,
        value: sum / count,
      }));
    };

    const aggregateAllData = useMemo(() => {
      const filteredData = data.filter((item) =>
        selectedProperties.includes(item.propertyName)
      );

      return filteredData.map(({ propertyName, data }) => {
        const aggregated = aggregateData(data, selectedFilter);
        return {
          type: "line",
          name: propertyName,
          unit: data[0]?.unit || "Value",
          data: aggregated.map(({ date, value }) => [
            new Date(date).getTime(), // X value: timestamp
            value, // Y value: number
          ]) as [number, number][], // Cast to ensure type correctness
        };
      });
    }, [data, selectedProperties, selectedFilter, aggregateData]);

    // Fetch data on mount and when items change
    useEffect(() => {
      DataService.fetchDimensionValuesMultiItem(items, {
        historyType: "relative",
        unit: "year",
        value: 2,
      }).then((result) => {
        const transformedData = transformData(result);
        setData(transformedData);
      });
    }, [DataService, items]);

    const properties = useMemo(() => fetchProperties(items), [items]);

    const timeFilter = [
      { key: "daily", label: "Daily" },
      { key: "weekly", label: "Weekly" },
      { key: "monthly", label: "Monthly" },
      { key: "yearly", label: "Yearly" },
    ];

    const selectProperties = (e: any) => {
      const value = e.key;
      setSelectedProperties((prevValues) =>
        prevValues.includes(value)
          ? prevValues.filter((v) => v !== value)
          : [...prevValues, value]
      );
      if (selectedFilter == null) {
        selectFilter("day");
      }
    };

    const selectFilter = (key: string) => {
      setSelectedFilter(key);
    };

    const downloadGraph = () => {
      if (chartRef.current) {
        // Capture the chart using html2canvas
        html2canvas(chartRef.current).then((canvas) => {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // e.g. 2023-10-02T15-30-45

          const fileName = `${selectedFilter} (${timestamp}).png`;

          // Save the captured image
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = fileName; // Use the generated file name
          link.click();
        });
      }
    };

    const downloadData = () => {
      console.log("data", data);
      // Prepare CSV data
      const csvRows = [];

      // Add CSV headers
      const headers = ["ID", "Lake", "Property Name", "Unit", "Data"];
      csvRows.push(headers.join(","));

      // Loop over each sensor object
      data.forEach((sensor) => {
        // For each data point in the sensor's data array, add a row
        sensor.data.forEach((dataPoint) => {
          const row = [
            sensor.id,
            sensor.lake,
            sensor.propertyName,
            sensor.unit,
            dataPoint,
          ];
          csvRows.push(row.join(","));
        });
      });

      // Create a blob for the CSV data
      const csvData = new Blob([csvRows.join("\n")], { type: "text/csv" });

      // Create a link element
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvData);
      link.download = "sensor_data.csv";

      // Programmatically click the link to trigger download
      document.body.appendChild(link);
      link.click();

      // Remove the link after download
      document.body.removeChild(link);
    };

    return (
      <>
        <Typography.Title
          level={4}
          style={{ fontWeight: "bold", paddingBottom: "2%" }}
        >
          Verfügbare Daten zu diesem See
        </Typography.Title>

        <Row
          gutter={[16, 16]}
          style={{ marginTop: "2%", justifyContent: "space-evenly" }}
        >
          <CustomDropdown
            items={properties}
            selectedValues={selectedProperties}
            handleClick={selectProperties}
          />

          <SingleSelectDropdown
            items={timeFilter}
            placeholder="Select Frequency"
            selectedValue={selectedFilter}
            handleClick={selectFilter}
          />
        </Row>

        <CustomChart
          data={aggregateAllData}
          filter={selectedFilter}
          properties={selectedProperties}
          ref={chartRef}
        />

        <Row style={{ marginTop: "2%" }}>
          <Typography.Link
            style={{
              color: "#42A456",
              fontSize: "16px",
              display: "flex",
              flex: 0.65,
              alignItems: "center",
              justifyContent: "space-between",
            }}
            href="https://ant.design"
            target="_blank"
            underline
          >
            Wie wurden die dargestellten Daten erhoben?
          </Typography.Link>
          <Row
            style={{
              flex: 0.35,
              justifyContent: "space-between",
            }}
          >
            <CustomButton
              text="Download Graph"
              disabled={selectedProperties.length === 0}
              onClick={downloadGraph}
            />
            <CustomButton onClick={downloadData} text="Download Rohdaten" />
          </Row>
        </Row>
      </>
    );
  }
);
