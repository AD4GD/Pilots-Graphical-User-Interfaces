import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import { Col, Row, Typography } from "antd";
import React, { useMemo, useRef, useState } from "react";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import CollapseWrapper from "../../components/CollapseWrapper/CollapseWrapper";
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

export default createWidgetComponent((context) => {
  const navigate = useNavigate();
  const t = useTranslation();
  const items = context.useItemDimensionConfig();
  const chartRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedMainSensor, setSelectedMainSensor] = useState<string | null>(
    null
  );
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("daily");
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<string>("1");

  // Hooks
  const properties = useProperties(items);

  const sensorData = useSensorData(
    items,
    selectedFilter,
    null,
    null,
    "week",
    Number(selectedFrequency)
  );

  const selectedPropsMemo = useMemo(
    () => [...selectedProperties],
    [selectedProperties]
  );
  const chartData = useChartDataTransform(sensorData, selectedPropsMemo);

  const toggleMinimize = () => setIsMinimized((prev) => !prev);

  const handleMainSensorSelect = (key: string) => {
    setSelectedMainSensor(key);
    setSelectedProperties([key]);
  };

  const handlePredictionSelect = (e: any) => {
    const value = e.key;
    setSelectedProperties((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const downloadGraph = () =>
    downloadGraphAsPng(chartRef, sensorData, selectedFilter);
  const downloadData = () => downloadDataAsCsv(sensorData);

  const predictionItems = useMemo(() => {
    return selectedMainSensor && properties[selectedMainSensor]
      ? properties[selectedMainSensor].filter(
          (p) => p.key !== selectedMainSensor
        )
      : [];
  }, [selectedMainSensor, properties]);

  return (
    <>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4} style={{ fontWeight: "bold", margin: 0 }}>
          Seevorhersage
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
          style={{ marginTop: "2%", justifyContent: "space-around" }}
        >
          <SingleSelectDropdown
            items={properties["MainWithPrediction"]}
            selectedValue={selectedMainSensor}
            placeholder="Sensor auswählen"
            handleClick={handleMainSensorSelect}
          />

          <CustomDropdown
            items={predictionItems}
            selectedValues={selectedProperties}
            placeholder="Sensor auswählen"
            handleClick={handlePredictionSelect}
          />

          <SingleSelectDropdown
            items={[
              { key: "1", label: "1 Woche" },
              { key: "2", label: "2 Wochen" },
              { key: "3", label: "3 Wochen" },
              { key: "4", label: "4 Wochen" },
            ]}
            selectedValue={selectedFrequency}
            placeholder="Frequenz auswählen"
            handleClick={setSelectedFrequency}
          />
        </Row>

        <CustomChart
          data={chartData}
          filter={selectedFilter}
          properties={selectedPropsMemo}
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
            Wie wurden die präsentierten Daten erhoben?
          </Typography.Link>
          <Row style={{ flex: 0.45, justifyContent: "flex-end", gap: "10px" }}>
            <CustomButton
              text="Diagramm herunterladen"
              disabled={selectedProperties.length === 0}
              onClick={downloadGraph}
            />
            <CustomButton
              onClick={downloadData}
              text="Rohdaten herunterladen"
              disabled={selectedProperties.length === 0}
            />
          </Row>
        </Row>
      </CollapseWrapper>
    </>
  );
});
