import React, { useEffect, useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Row, Typography } from "antd";
import { useDataService } from "@opendash/plugin-timeseries";
import { $framework } from "@opendash/core";

import {
  SingleSelectDropdown,
  CustomDropdown,
} from "../../components/dropdown";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import { ConfigInterface, AggregationOperationInterface } from "./types";
import { DatePicker } from "../../components/datePicker";
import {
  FilterType,
  SensorData,
  ChartData,
  FilterOption,
  DataPoint,
} from "../../types/Lake_Stats";
import { useNavigate } from "@opendash/router";

const { Title } = Typography;

// Main Component
export default createWidgetComponent<ConfigInterface>(({ ...context }) => {
  const navigate = useNavigate();
  const t = useTranslation();
  context["setLoading"](false);
  console.log("CONTEXT", context);
  console.log(context.config._items);
  console.log(context.config._sources);
  const DataService = useDataService();
  const items = context["useItemDimensionConfig"]();

  function filterItemsBySource(items: any[], sourceName: string) {
    return items.filter((item) => item[0].source === sourceName);
  }

  const ad4gdLakesItems = filterItemsBySource(items, "ad4gd_lakes");
  const ad4gdPrivateItems = filterItemsBySource(items, "ad4gd_private");

  console.log("ITEMS", items);
  console.log("AD4GD LAKES ITEMS", ad4gdLakesItems);
  console.log("AD4GD PRIVATE ITEMS", ad4gdPrivateItems);
  console.log(
    "isAdmin",
    $framework.services.UserService.hasPermission("parse-admin")
  );
  const chartRef = useRef<HTMLDivElement>(null);

  // State Variables
  const [data, setData] = useState<SensorData[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("daily"); // Restrict to valid filter types
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);

  function separateSensors() {
    const targetIds = [
      "sensor_halensee_precipitation",
      "sensor_halensee_evaporation",
    ];
    const matched: any[] = [];
    const remaining: any[] = [];

    items.forEach((item) => {
      if (Array.isArray(item) && item[0] && targetIds.includes(item[0].id)) {
        matched.push(item);
      } else {
        remaining.push(item);
      }
    });

    Promise.all([
      fetchData(matched, selectedFilter, startDate, endDate, "sum"),
      fetchData(remaining, selectedFilter, startDate, endDate, "avg"),
    ]).then(([matchedData, remainingData]) => {
      const combinedData = [...matchedData, ...remainingData];
      setData(combinedData);
    });
  }

  // Fetch data based on selected filter and date range
  const fetchData = async (
    items: any[],
    filter: FilterType,
    startDate?: number | null,
    endDate?: number | null,
    aggregationOperation?: AggregationOperationInterface
  ) => {
    // console.log("FETCHING DATA");
    const filterUnitMap: Record<FilterType, "day" | "week" | "month" | "year"> =
      {
        daily: "day",
        weekly: "week",
        monthly: "month",
        yearly: "year",
      };

    const result = await DataService.fetchDimensionValuesMultiItem(items, {
      historyType: startDate && endDate ? "absolute" : "relative",
      unit: "month",
      start: startDate ?? undefined, // Pass undefined when startDate is null
      end: endDate ?? undefined, // Pass undefined when endDate is null
      value: 1000, // Fetch a large range for relative history
      aggregation: true,
      aggregationOperation:
        aggregationOperation as AggregationOperationInterface,
      aggregationDateUnit: filterUnitMap[filter],
    });
    // console.log("RESULT ++++++", result);
    return transformData(result);
  };

  // Initial data fetch and when filter or date range changes
  useEffect(() => {
    separateSensors();
  }, [DataService, items, selectedFilter, startDate, endDate]);

  // Fetch Properties from item dimensions
  const fetchProperties = (items: any[]): FilterOption[] => {
    return items.map((item: any[]) => {
      const { valueTypes } = item[0];
      const key = valueTypes[0].name;
      const label = valueTypes[0].name;

      return { key, label };
    });
  };

  // Transform raw data into usable format
  const transformData = (data: any[]): SensorData[] => {
    return data.map((item: any[]) => {
      const { id, name: lake, valueTypes } = item[0];
      const propertyName = valueTypes[0].name;
      const unit = valueTypes[0].unit;
      const dataPoints = item[2];

      return { id, lake, propertyName, unit, data: dataPoints };
    });
  };

  // Map properties for selection dropdown
  const properties = useMemo(() => fetchProperties(items), [items]);
  // console.log("PROPERTIES", properties);

  // Time filter options
  const timeFilter: FilterOption[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
  ];

  // Select properties for chart
  const selectProperties = (e: any) => {
    const value = e.key;
    setSelectedProperties((prevValues) =>
      prevValues.includes(value)
        ? prevValues.filter((v) => v !== value)
        : [...prevValues, value]
    );
  };

  // Select filter type
  const selectFilter = (key: FilterType) => {
    setSelectedFilter(key);
  };

  // Handle start date change
  const handleStartDateChange = (timestamp: number | null) => {
    setStartDate(timestamp);
  };

  // Handle end date change
  const handleEndDateChange = (timestamp: number | null) => {
    setEndDate(timestamp);
  };

  // Download Graph as PNG
  const downloadGraph = () => {
    if (chartRef.current) {
      html2canvas(chartRef.current).then((canvas) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const lakeName =
          data.length > 0 ? data[0].lake.split(" ")[0] : "sensor_data";
        const fileName = `${lakeName}-${selectedFilter} (${timestamp}).png`;

        const imgData = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imgData;
        link.download = fileName;
        link.click();
      });
    }
  };

  // Download Data as CSV
  const downloadData = () => {
    const csvRows: string[] = [];
    const allTimestamps = new Set<string>();
    const sensorNames = new Set<string>();

    data.forEach((sensor) => {
      sensor.data.forEach((dataPoint) => {
        allTimestamps.add(dataPoint.date);
      });
      sensorNames.add(`${sensor.propertyName} (${sensor.unit})`);
    });

    const timestampsArray = Array.from(allTimestamps).sort(
      (a: any, b: any) => a - b
    );
    const headers = ["Timestamp", ...Array.from(sensorNames)];
    csvRows.push(headers.join(","));

    const sensorDataMap: { [key: string]: { [key: string]: number } } = {};
    timestampsArray.forEach((timestamp) => {
      sensorDataMap[timestamp] = {};
    });

    data.forEach((sensor) => {
      sensor.data.forEach((dataPoint) => {
        const timestamp = dataPoint.date;
        const sensorKey = `${sensor.propertyName} (${sensor.unit})`;
        sensorDataMap[timestamp][sensorKey] = dataPoint.value;
      });
    });

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

  // Function to transform the data for the chart
  const transformDataForChart = (): ChartData[] => {
    return data
      .filter((sensor) => selectedProperties.includes(sensor.propertyName))
      .map(
        (sensor): ChartData => ({
          type: "line", // Default to line chart
          name: sensor.propertyName,
          unit: sensor.unit,
          data: sensor.data.map((point: DataPoint) => [
            new Date(point.date).getTime(), // Convert date string to UNIX timestamp
            point.value,
          ]),
        })
      );
  };

  return (
    <>
      <Title level={4} style={{ fontWeight: "bold", paddingBottom: "2%" }}>
        Verfügbare Daten zu diesem See
      </Title>

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
          placeholder="Start Date"
        />
        <DatePicker onDateChange={handleEndDateChange} placeholder="End Date" />
      </Row>

      <CustomChart
        data={transformDataForChart()}
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
        <Row style={{ flex: 0.45, justifyContent: "flex-end", gap: "10px" }}>
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
          <CustomButton
            onClick={() => {
              navigate(`/upload`);
            }}
            text="Upload Data"
          />
        </Row>
      </Row>
    </>
  );
});
