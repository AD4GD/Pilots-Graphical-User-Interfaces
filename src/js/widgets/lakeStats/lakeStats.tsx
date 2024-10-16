import React, { useEffect, useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Row, Space, Typography } from "antd";
import { useDataService } from "@opendash/plugin-timeseries";

import {
  SingleSelectDropdown,
  CustomDropdown,
} from "../../components/dropdown";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import { ConfigInterface } from "./types";
import { DatePicker } from "../../components/datePicker";

const { Title } = Typography; // Destructuring Typography to use 'Title' for headings

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

interface DataPoint {
  date: number;
  value: number;
}

interface Sensor {
  id: string;
  lake: string;
  propertyName: string;
  unit: string;
  data: DataPoint[];
}

export default createWidgetComponent<ConfigInterface>(({ ...context }) => {
  const t = useTranslation();
  context["setLoading"](false);
  const DataService = useDataService();
  const items = context["useItemDimensionConfig"]();
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
    setSelectedProperties((prevValues: string[]) =>
      prevValues.includes(value)
        ? prevValues.filter((v) => v !== value)
        : [...prevValues, value]
    );
    if (selectedFilter == null) {
      selectFilter("daily");
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
        const lakeName =
          data.length > 0 ? data[0].lake.split(" ")[0] : "sensor_data";

        const fileName = `${lakeName}-${selectedFilter} (${timestamp}).png`;

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
    const csvRows = [];

    const allTimestamps = new Set<string>();
    const sensorNames = new Set<string>();

    // Collect unique timestamps and sensor names
    data.forEach((sensor) => {
      sensor.data.forEach((dataPoint) => {
        allTimestamps.add(dataPoint.date);
      });
      sensorNames.add(`${sensor.propertyName} (${sensor.unit})`);
    });

    const timestampsArray = Array.from(allTimestamps).sort((a, b) => a - b);
    const headers = ["Timestamp", ...Array.from(sensorNames)];
    csvRows.push(headers.join(","));

    const sensorDataMap: { [key: string]: { [key: string]: number } } = {};

    // Initialize the map for each timestamp
    timestampsArray.forEach((timestamp) => {
      sensorDataMap[timestamp] = {};
    });

    // Populate the map with sensor data
    data.forEach((sensor) => {
      sensor.data.forEach((dataPoint) => {
        const timestamp = dataPoint.date;
        const sensorKey = `${sensor.propertyName} (${sensor.unit})`;
        sensorDataMap[timestamp][sensorKey] = dataPoint.value;
      });
    });

    // Build rows for each timestamp
    timestampsArray.forEach((timestamp) => {
      const row: string[] = [new Date(timestamp).toISOString()];
      headers.slice(1).forEach((sensorKey) => {
        const value = sensorDataMap[timestamp][sensorKey] || "";
        row.push(value.toString());
      });
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Dynamically create the filename based on lake name
    const lakeName =
      data.length > 0 ? data[0].lake.split(" ")[0] : "sensor_data";
    const filename = `${lakeName}_sensors_data.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [startDate, setStartDate] = useState<number | null>(null); // Store start date
  const [endDate, setEndDate] = useState<number | null>(null); // Store end date

  // Callback function to handle the selected start date in Unix timestamp
  const handleStartDateChange = (timestamp: number | null) => {
    setStartDate(timestamp); // Set the selected start date
  };

  // Callback function to handle the selected end date in Unix timestamp
  const handleEndDateChange = (timestamp: number | null) => {
    setEndDate(timestamp); // Set the selected end date
  };

  // Function to handle the data processing once both dates are selected
  const handleData = () => {
    if (startDate && endDate) {
      console.log("Processing data between:", startDate, "and", endDate);
      DataService.fetchDimensionValuesMultiItem(items, {
        historyType: "absolute",
        unit: "month",
        start: startDate,
        end: endDate,
        value: 2,
      }).then((result) => {
        const transformedData = transformData(result);
        setData(transformedData);
      });
    }
  };

  // Call handleData when both startDate and endDate are selected
  useEffect(() => {
    if (startDate && endDate) {
      handleData(); // Call the data handler when both dates are selected
    }
  }, [startDate, endDate]); // Only call handleData when both dates are updated

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
        <DatePicker
          onDateChange={handleStartDateChange}
          placeholder="Start Date" // Placeholder for start date
        />
        <DatePicker
          onDateChange={handleEndDateChange}
          placeholder="End Date" // Placeholder for end date
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
            flex: 0.55,
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
            flex: 0.45,
            justifyContent: "flex-end",
          }}
        >
          <CustomButton
            text="Download Graph"
            disabled={selectedProperties.length === 0}
            onClick={downloadGraph}
          />
          <CustomButton
            onClick={downloadData}
            text="Download Rohdaten"
            disabled={selectedProperties.length === 0}
          />
        </Row>
      </Row>
    </>
  );
});
