import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import { Row, Typography, Modal, Table } from "antd";
import React, { useRef, useState, useMemo } from "react";
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
import { $framework } from "@opendash/core";

const { Title } = Typography;

export default createWidgetComponent(({ ...context }) => {
  const navigate = useNavigate();
  const t = useTranslation();
  context["setLoading"](false);
  const items = context["useItemDimensionConfig"]();

  const isAdmin = $framework.services.UserService.hasPermission("parse-admin");

  function filterItemsBySource(items: any[], sourceName: string) {
    return items.filter((item) => item[0].source === sourceName);
  }

  const ad4gdLakesItems = filterItemsBySource(items, "ad4gd_lakes");
  const ad4gdPrivateItems = filterItemsBySource(items, "ad4gd_private");
  const ad4gdPeriodicItems = filterItemsBySource(items, "ad4gd_periodic");
  const ad4gdPeriodicPrivateItems = filterItemsBySource(
    items,
    "ad4gd_periodic_private"
  );

  const displayItems = useMemo(() => {
    if (isAdmin) {
      return [
        ...ad4gdLakesItems,
        ...ad4gdPrivateItems,
        ...ad4gdPeriodicItems,
        ...ad4gdPeriodicPrivateItems,
      ];
    } else {
      return [...ad4gdLakesItems, ...ad4gdPeriodicItems];
    }
  }, [
    isAdmin,
    ad4gdLakesItems,
    ad4gdPrivateItems,
    ad4gdPeriodicItems,
    ad4gdPeriodicPrivateItems,
  ]);

  // Chart ref for Highcharts container, uniquely scoped
  const chartRef = useRef<HTMLDivElement>(null);

  // State variables with new arrays on update to avoid reference sharing
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("daily");
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDataModalVisible, setIsDataModalVisible] = useState(false);

  const properties = useProperties(displayItems);
  const timeFilter = useMemo(
    () => [
      { key: "daily" as FilterType, label: "Täglich" },
      { key: "weekly" as FilterType, label: "Wöchentlich" },
      { key: "monthly" as FilterType, label: "Monatlich" },
      { key: "yearly" as FilterType, label: "Jährlich" },
    ],
    []
  );
  const data = useSensorData(displayItems, selectedFilter, startDate, endDate);

  // Use a memoized copy of selectedProperties to avoid mutation side effects
  const selectedPropsMemo = useMemo(
    () => [...selectedProperties],
    [selectedProperties]
  );

  // Transform data for chart based on selectedProperties (defensive copy)
  const chartData = useChartDataTransform(data, selectedPropsMemo);

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

  // Toggle minimize state
  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const showDataModal = () => setIsDataModalVisible(true);
  const hideDataModal = () => setIsDataModalVisible(false);

  // Handle property selection (always create new array)
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

  // Download graph PNG (pass unique ref)
  const downloadGraph = () => {
    downloadGraphAsPng(chartRef, data, selectedFilter);
  };

  // Download CSV data
  const downloadData = () => {
    // Filter data to only selected properties
    const filteredData = data.filter((sensor) =>
      selectedProperties.includes(sensor.propertyName)
    );
    downloadDataAsCsv(filteredData);
  };

  return (
    <>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4} style={{ fontWeight: "bold", margin: 0 }}>
          Seestatistiken
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
            items={(properties as any)["Main"]}
            selectedValues={selectedProperties}
            placeholder="Sensor auswählen"
            handleClick={selectProperties}
          />
          <SingleSelectDropdown
            items={timeFilter}
            placeholder="Frequenz auswählen"
            selectedValue={selectedFilter}
            handleClick={selectFilter}
          />
          <DatePicker
            onDateChange={handleStartDateChange}
            placeholder="Startdatum"
          />
          <DatePicker
            onDateChange={handleEndDateChange}
            placeholder="Enddatum"
          />
        </Row>

        <CustomChart
          data={chartData}
          filter={selectedFilter}
          properties={selectedPropsMemo} // Pass memoized copy
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
