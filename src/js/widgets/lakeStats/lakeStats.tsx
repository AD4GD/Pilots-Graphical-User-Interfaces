import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import { Row, Typography } from "antd";
import React, { useRef, useState } from "react";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import CollapseWrapper from "../../components/CollapseWrapper/CollapseWrapper";
import { DatePicker } from "../../components/datePicker";
import {
  CustomDropdown,
  SingleSelectDropdown,
} from "../../components/dropdown";
import { useChartDataTransform } from "../../hooks/useChartDataTransform";
import { useProperties } from "../../hooks/useProperties";
import { useSensorData } from "../../hooks/useSensorData";
import { FilterType } from "../../types/Lake_Stats";
import {
  downloadDataAsCsv,
  downloadGraphAsPng,
} from "../../utlis/downloadUtils";

const { Title } = Typography;

export default createWidgetComponent(({ ...context }) => {
  const navigate = useNavigate();
  const t = useTranslation();
  context["setLoading"](false);
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
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("daily");
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Hooks
  const properties = useProperties(items);
  const timeFilter = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
  ];
  const data = useSensorData(items, selectedFilter, startDate, endDate);
  const chartData = useChartDataTransform(data, selectedProperties);

  // Toggle Minimize State
  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  // Handle property selection
  const selectProperties = (e: any) => {
    const value = e.key;
    setSelectedProperties((prevValues) =>
      prevValues.includes(value)
        ? prevValues.filter((v) => v !== value)
        : [...prevValues, value]
    );
  };

  // Handle filter selection
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
    downloadGraphAsPng(chartRef, data, selectedFilter);
  };

  // Download Data as CSV
  const downloadData = () => {
    downloadDataAsCsv(data);
  };

  return (
    <>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4} style={{ fontWeight: "bold", margin: 0 }}>
          Lake Statistics
        </Title>
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
          onClick={toggleMinimize}
        >
          {isMinimized ? (
            <DownOutlined style={{ fontSize: 20 }} />
          ) : (
            <UpOutlined style={{ fontSize: 20 }} />
          )}
        </div>
      </Row>

      <CollapseWrapper isCollapsed={isMinimized}>
        <Row
          gutter={[16, 16]}
          style={{ marginTop: "2%", justifyContent: "space-evenly" }}
        >
          <CustomDropdown
            items={properties["Main"]}
            selectedValues={selectedProperties}
            placeholder="Select Sensor"
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
          <DatePicker
            onDateChange={handleEndDateChange}
            placeholder="End Date"
          />
        </Row>

        <CustomChart
          data={chartData}
          filter={selectedFilter}
          properties={selectedProperties}
          ref={chartRef}
          multipleAxis={true}
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
            How was the data presented collected?
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
          </Row>
        </Row>
      </CollapseWrapper>
    </>
  );
});
