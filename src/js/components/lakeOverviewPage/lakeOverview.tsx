import React, { useEffect, useMemo, useState } from "react";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";
import {
  Avatar,
  Button,
  Flex,
  Input,
  List,
  Row,
  Typography,
  AutoComplete,
  ConfigProvider,
  Tooltip,
  Modal,
} from "antd";
import { useNavigate } from "@opendash/router";
import { SearchOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useLakeWQIColors } from "../../hooks/useLakeWQIColors";

const { Title, Text } = Typography;

const LakeOverview: React.FC = () => {
  const navigate = useNavigate();

  const [zones, setZones] = useState(
    [] as {
      type: string;
      label: string;
      id: string;
    }[]
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isWQIModalVisible, setIsWQIModalVisible] = useState<boolean>(false);

  // Get WQI colors for all lakes
  const { wqiData, loading: wqiLoading } = useLakeWQIColors(zones);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const zones = await new Parse.Query("MIAAS_Geographies").find();
    setZones(
      zones.map((zone) => {
        return {
          label: zone.get("label"),
          id: zone.id,
          type: zone.get("description"),
          sensors: zone.get("sensors"),
        };
      })
    );
  };

  //Query Lake Meta Data
  // const lakeQuery = useMemo(() => {
  //   return new Parse.Query("AD4GD_LakeMetaData");
  // }, []);

  // const { result: lakes, reload, error, loading } = useParseQuery(lakeQuery);

  // console.log({ lakes });

  const handleNavigateToStats = (item: {
    type: string;
    label: string;
    id: string;
  }) => {
    navigate(`/splashboard/lake/${item.id}`, { state: { item } });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const filteredOptions = zones
      .filter(
        (zone) =>
          zone.type === "lake" &&
          zone.label.toLowerCase().includes(value.toLowerCase())
      )
      .map((zone) => ({ value: zone.label }));

    setOptions(filteredOptions);
  };

  const handleSelect = (value: string) => {
    setSearchQuery(value);
  };

  const filteredZones = useMemo(() => {
    const selectedZone = zones.find(
      (zone) =>
        zone.type === "lake" &&
        zone.label.toLowerCase() === searchQuery.toLowerCase()
    );

    if (selectedZone) {
      return [selectedZone];
    }

    return zones.filter(
      (zone) =>
        zone.type === "lake" &&
        zone.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zones, searchQuery]);

  // test cloud function on server
  const fetchData = async () => {
    try {
      const results = await Parse.Cloud.run("getData");
      console.log(results);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const showWQIModal = () => {
    setIsWQIModalVisible(true);
  };

  const handleWQIModalOk = () => {
    setIsWQIModalVisible(false);
  };

  const handleWQIModalCancel = () => {
    setIsWQIModalVisible(false);
  };

  return (
    <>
      <ConfigProvider
        wave={{ disabled: true }}
        theme={{
          token: {
            colorPrimary: "#96F5D0",
            colorTextLightSolid: "black",
            borderRadius: 6,
            fontSize: 16,
          },
        }}
      >
        <Row style={{ width: "100%", height: "80px" }}>
          <WidgetStatic
            style={{ width: "100%", height: "100%" }}
            type="header-widget"
            config={""}
          ></WidgetStatic>
        </Row>

        <Row
          style={{
            width: "100%",
            height: "calc(90vh - 80px)",
            backgroundColor: "white",
            overflow: "hidden",
          }}
        >
          <Flex
            gap="middle"
            align="start"
            style={{ width: "100%", height: "100%" }}
          >
            <Flex
              gap="small"
              vertical={true}
              style={{ width: "67%", height: "100%", padding: "0 1rem" }}
            >
              <Title
                level={1}
                style={{
                  fontWeight: "bold",
                  marginBottom: "1%",
                  width: "100%",
                  letterSpacing: "0.25rem",
                  paddingTop: "1.5rem",
                }}
              >
                Kleine Seen in Berlin
              </Title>

              <Input.Group compact>
                <AutoComplete
                  options={options}
                  style={{ width: 220 }}
                  onSearch={handleSearch}
                  onSelect={handleSelect}
                  placeholder="See suchen..."
                  value={searchQuery}
                />
                <Button
                  icon={<SearchOutlined />}
                  onClick={() => handleSearch(searchQuery)}
                />
              </Input.Group>

              <WidgetStatic
                style={{
                  width: "100%",
                  height: "calc(100% - 100px)",
                  position: "relative",
                }}
                type="lake-map-widget"
                config={""}
              ></WidgetStatic>
            </Flex>

            <Flex
              vertical
              style={{
                width: "33%",
                height: "100%",
                backgroundColor: "#E9ECEF",
                padding: "1rem",
                overflow: "hidden",
              }}
            >
              <Title
                level={1}
                style={{
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  fontFamily: "Josefin Sans",
                  paddingTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Wasserqualitätindex
                <InfoCircleOutlined
                  style={{
                    color: "#42A456",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                  onClick={showWQIModal}
                />
              </Title>

              <Text style={{ marginBottom: "1rem", display: "block" }}>
                Der Wasserqualitätsindex vergleicht die unten dargestellten Seen
                in Bezug auf ihre Wasserqualität basierend auf langfristigen
                Datenerhebungen.
              </Text>

              <div
                style={{
                  width: "100%",
                  textAlign: "left",
                  marginBottom: "1rem",
                }}
              >
                <Button
                  type="link"
                  style={{
                    color: "#42A456",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                  onClick={showModal}
                >
                  Mehr zur Datenerhebung
                </Button>
              </div>

              <div
                style={{
                  flexGrow: 1,
                  overflow: "auto",
                  marginBottom: "1rem",
                }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={filteredZones}
                  size="small"
                  split={false}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={
                              <svg width="12" height="12">
                                {" "}
                                <circle
                                  cx="6"
                                  cy="6"
                                  r="6"
                                  fill={wqiData[item.id]?.color || "#8c8c8c"}
                                />
                              </svg>
                            }
                          />
                        }
                        title={
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigateToStats(item);
                            }}
                          >
                            {item.label}
                          </a>
                        }
                        description={"See"}
                      />
                    </List.Item>
                  )}
                />
              </div>
            </Flex>
          </Flex>
        </Row>

        <Modal
          title="Mehr zur Datenerhebung"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          centered
          width={500}
          footer={[
            <Button key="ok" type="primary" onClick={handleModalOk}>
              OK
            </Button>,
          ]}
          styles={{
            header: {
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e8e8e8",
            },
          }}
        >
          <div
            style={{
              padding: "20px 0",
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#333",
              textAlign: "left",
            }}
          >
            Der Datensatz wurde am 25.05.25 mit den Daten der Copernicus
            Sentinel-2 Mission aus den Jahren 2018 bis 2024 erstellt.
          </div>
        </Modal>

        <Modal
          title="Wasserqualitätsindex"
          open={isWQIModalVisible}
          onOk={handleWQIModalOk}
          onCancel={handleWQIModalCancel}
          centered
          width={700}
          footer={[
            <Button key="ok" type="primary" onClick={handleWQIModalOk}>
              OK
            </Button>,
          ]}
          styles={{
            header: {
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e8e8e8",
            },
          }}
        >
          <div
            style={{
              padding: "20px 0",
              lineHeight: "1.6",
              color: "#333",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  color: "#42A456",
                  fontSize: "18px",
                  marginBottom: "12px",
                }}
              >
                Was ist der Wasserqualitätsindex?
              </h3>
              <div style={{ fontSize: "16px", lineHeight: "1.6" }}>
                Der Wasserqualitätsindex beschreibt die Trophie eines Gewässers.
                Er basiert auf der Auswertung von Satellitendaten der{" "}
                <a
                  href="https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#42A456",
                    textDecoration: "underline",
                  }}
                >
                  ESA Copernicus Sentinel-2 Mission
                </a>{" "}
                und wird als ein jährlicher Kennwert pro Gewässer berechnet. Der
                Index ist definiert für einen Bereich zwischen -1 und 1, wobei
                Gewässer in der Regel zwischen -0,5 (oligotroph) und 0,4
                (hypertroph) liegen, d.h. je geringer der Wasserqualitätsindex
                ist, desto geringer wird die Trophie eingeschätzt. Ein positiver
                Trend der Wasserqualität bedeutet gleichermaßen, dass das
                Gewässer eutrophiert und somit die Wasserqualität abnimmt.
              </div>
            </div>
            <div>
              <h3
                style={{
                  color: "#42A456",
                  fontSize: "18px",
                  marginBottom: "12px",
                }}
              >
                Wie richtig ist der Wasserqualitätsindex?
              </h3>
              <div style={{ fontSize: "16px", lineHeight: "1.6" }}>
                Der Wasserqualitätsindex wurde mithilfe von durch das{" "}
                <a
                  href="https://lfu.brandenburg.de/lfu/de/aufgaben/wasser/fliessgewaesser-und-seen/gewaesserzustandsbewertung/seensteckbriefe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#42A456",
                    textDecoration: "underline",
                  }}
                >
                  Landesamt für Umwelt Brandenburg (LfU) gemessenen
                  Trophiewerten
                </a>{" "}
                entwickelt. Für 294 Brandenburger Seen konnte ein starker
                Zusammenhang zwischen Messwerten und berechnetem
                Wasserqualitätsindex in den Jahren 2018 bis 2023 beschrieben
                werden. Für jedes dieser Jahre betrug die Korrelation (Pearson)
                beider Methoden zwischen 0.83 und 0.92. Der Wasserqualitätsindex
                ist nicht gedacht, um die Trophi direkt zu bestimmen. Vielmehr
                soll er eine Rangordnung der Trophie zwischen Seen und eine
                Trendanalyse ermöglichen, um problematische Entwicklungen zu
                identifizieren oder Wasserqualitätsmaßnahmen zu bewerten.
              </div>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default LakeOverview;
