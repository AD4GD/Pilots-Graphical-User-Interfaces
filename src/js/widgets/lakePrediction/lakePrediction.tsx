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
  const chartRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedMainSensor, setSelectedMainSensor] = useState<string | null>(
    null
  );
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

  const toggleMinimize = () => setIsMinimized((prev) => !prev);

  // Handle Main Sensor Selection
  const handleMainSensorSelect = (key: string) => {
    setSelectedMainSensor(key);
    setSelectedProperties([key]); // Only select main sensor initially
  };

  // Handle Prediction Sensor Selection
  const handlePredictionSelect = (e: any) => {
    const value = e.key;
    setSelectedProperties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Handle filter and date

  const handleStartDateChange = (timestamp: number | null) =>
    setStartDate(timestamp);
  const handleEndDateChange = (timestamp: number | null) =>
    setEndDate(timestamp);

  // Downloads
  const downloadGraph = () =>
    downloadGraphAsPng(chartRef, data, selectedFilter);
  const downloadData = () => downloadDataAsCsv(data);

  const predictionItems =
    selectedMainSensor && properties[selectedMainSensor]
      ? properties[selectedMainSensor].filter(
          (p) => p.key !== selectedMainSensor
        )
      : [];

  return (
    <>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4} style={{ fontWeight: "bold", margin: 0 }}>
          Lake Prediction
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
          <SingleSelectDropdown
            items={properties["Main"]}
            selectedValue={selectedMainSensor}
            placeholder="Select Sensor"
            handleClick={handleMainSensorSelect}
          />

          {selectedMainSensor && (
            <CustomDropdown
              items={predictionItems}
              selectedValues={selectedProperties}
              placeholder="Select Prediction Sensor"
              handleClick={handlePredictionSelect}
            />
          )}

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
          multipleAxis={false}
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
