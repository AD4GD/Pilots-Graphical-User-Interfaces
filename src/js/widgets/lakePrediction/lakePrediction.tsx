import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import { Col, Row, Typography, Modal, Table } from "antd";
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
  const [isDataModalVisible, setIsDataModalVisible] = useState(false);

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

  // Dataset information for the modal
  const datasetInfo = [
    {
      key: "1",
      dataset: "Water level",
      description:
        "Wasserstand in cm über Pegelnullpunkt aus dem Wasserportal Berlin",
      source: "https://wasserportal.berlin.de/start.php",
    },
    {
      key: "2",
      dataset: "Water temperature",
      description: "Wassertemperatur in °C aus dem Wasserportal Berlin",
      source: "https://wasserportal.berlin.de/start.php",
    },
    {
      key: "3",
      dataset: "Water morphology",
      description:
        "Daten aus dem Gewässeratlas von Berlin : von der Gewässervermessung zum Gewässeratlas von Berlin mit hydrographischem Informationssystem / Hrsg.: Senatsverwaltung für Stadtentwicklung, Bereich Kommunikation.",
      source: "https://digital.zlb.de/viewer/metadata/15468374/",
    },
    {
      key: "4",
      dataset: "Precipitation",
      description:
        "Summe der Niederschläge in mm (einschließlich Regen, Schauer und Schneefall)",
      source: "https://open-meteo.com/en/docs/historical-weather-api",
    },
    {
      key: "5",
      dataset: "Air Temperature",
      description:
        "Mittlere Tagestemperatur in °C in 2 m Über Geländeoberkante",
      source: "https://open-meteo.com/en/docs/historical-weather-api",
    },
    {
      key: "6",
      dataset: "Reference-Evapotranspiration",
      description:
        "Referenz-Evapotranspiration eines gut bewässerten Grasfeldes. Basierend auf den FAO-56-Penman-Monteith-Gleichungen wird ET₀ aus Temperatur, Windgeschwindigkeit, Luftfeuchtigkeit und Sonneneinstrahlung berechnet. Es wird von unbegrenzter Bodenfeuchtigkeit ausgegangen.",
      source: "https://open-meteo.com/en/docs/historical-weather-api",
    },
    {
      key: "7",
      dataset: "Biotopwerte",
      description:
        "Im Projekt Biotoptypenkarte Berlin wurden zwischen 2003 und 2013 Biotope im Gelände- oder durch Luftbildkartierungen erfasst (Primärdaten) erfasst. Für Siedlungsbereiche wurden Biotopdaten aus anderen Quellen (Sekundärdaten) abgeleitet. Die Prüfung ob ein Biotop gesetzlich geschützt ist oder ein Lebensraumtyp nach der FFH-Richtlinie vorliegt erfolgte nur bei den Geländekartierungen. Aus dem Gesamtdatenbestand sind Thematische Karten zu FFH-LRT und gesetzlich geschützten Biotopen abgeleitet.",
      source:
        "https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/4ecb025b-c04f-3d6e-b4b5-e333d4e939fc",
    },
    {
      key: "8",
      dataset: "Versorgung mit öffentlichen, wohnungsnahen Grünanlagen 2016",
      description:
        "Versorgungsgrad (qm pro Einwohner) von Wohnblöcken mit öffentlichen, wohnungsnahen Grünanlagen unter Berücksichtigung vorhandener privater und halböffentlicher Freiräume, Sachstand 2016",
      source:
        "https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/866fe342-409a-39dc-addc-88d95b20541d",
    },
    {
      key: "9",
      dataset:
        "Schutzgebiete und Schutzobjekte nach Naturschutzrecht Berlin (inklusive Natura 2000)",
      description:
        "Naturschutz- und Landschaftsschutzgebiete, Naturdenkmale in flächiger Ausprägung und als Objekte, geschützte Landschaftsbestandteile, Naturpark Barnim (Berliner Teil), FFH - Gebiete und Vogelschutzgebiete (SPA - Flächen) des Netzes Natura 2000, einstweilig sichergestellte Flächen in einer aktuellen, grundstücksgenauen Karte im Maßstab 1:1.000). Die amtlichen Karten zur jeweiligen Schutzverordnung können bei der jeweils örtlich zuständigen unteren Behörde für Naturschutz und Landschaftspflege im Bezirksamt oder bei der obersten Behörde für Naturschutz und Landschaftspflege (Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und UmweltAbt. III) eingesehen werden. Nur diese amtlichen analogen Karten sind rechtsverbindlich, sofern die Karten nicht im Gesetz- und Verordnungsblatt für Berlin mitveröffentlicht wurden.",
      source:
        "https://gdi.berlin.de/geonetwork/srv/ger/catalog.search#/metadata/da2d17c0-6f29-3fae-848d-7f4f1cffa8a3",
    },
  ];

  const tableColumns = [
    {
      title: "Dataset",
      dataIndex: "dataset",
      key: "dataset",
      width: "20%",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "60%",
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: "20%",
      render: (text: string) => (
        <Typography.Link href={text} target="_blank">
          {text}
        </Typography.Link>
      ),
    },
  ];

  const toggleMinimize = () => setIsMinimized((prev) => !prev);

  const showDataModal = () => setIsDataModalVisible(true);
  const hideDataModal = () => setIsDataModalVisible(false);

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
  // Download CSV data
  const downloadData = () => {
    // Filter data to only selected properties
    const filteredData = sensorData.filter((sensor) =>
      selectedProperties.includes(sensor.propertyName)
    );
    downloadDataAsCsv(filteredData);
  };

  const predictionItems = useMemo(() => {
    return selectedMainSensor && (properties as any)[selectedMainSensor]
      ? (properties as any)[selectedMainSensor].filter(
          (p: any) => p.key !== selectedMainSensor
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
              cursor: "pointer",
            }}
            onClick={showDataModal}
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

      <Modal
        title="Datenerhebung - Wie wurden die präsentierten Daten erhoben?"
        open={isDataModalVisible}
        onCancel={hideDataModal}
        footer={null}
        width={1200}
      >
        <Table
          columns={tableColumns}
          dataSource={datasetInfo}
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      </Modal>
    </>
  );
});
