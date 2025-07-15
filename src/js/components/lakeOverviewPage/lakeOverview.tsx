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
  Select,
} from "antd";
import { useNavigate } from "@opendash/router";
import {
  SearchOutlined,
  InfoCircleOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import { useLakeWQIColors } from "../../hooks/useLakeWQIColors";

const { Title, Text } = Typography;
const { Option } = Select;

const LakeOverview: React.FC = () => {
  const navigate = useNavigate();

  const [zones, setZones] = useState(
    [] as {
      type: string;
      label: string;
      id: string;
      sensors?: any;
    }[]
  );
  const [lakes, setLakes] = useState(
    [] as {
      type: string;
      label: string;
      id: string;
      sensors?: any;
      wqiColor?: string;
      realWQI?: number;
    }[]
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isWQIModalVisible, setIsWQIModalVisible] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<
    "best-to-worst" | "worst-to-best" | "none"
  >("none");

  // Get WQI colors for all lakes
  const { wqiData, loading: wqiLoading } = useLakeWQIColors(zones);

  // Function to fetch real WQI values from Parse
  const fetchRealWQIValues = async (lakesArray: typeof lakes) => {
    const updatedLakes = await Promise.all(
      lakesArray.map(async (lake) => {
        try {
          // Query to get the WQI value for this specific lake
          const query = new Parse.Query("AD4GD_Lake_Quality_Index");
          query.equalTo("lake", lake.label);
          const results = await query.find();

          let realWQI: number | undefined;

          if (results.length > 0) {
            const lakeObject = results[0];
            const wqiStatus = lakeObject.get("WQI_status");
            realWQI = wqiStatus ? parseFloat(wqiStatus.toFixed(5)) : undefined;
          } else {
            // Try fuzzy matching as fallback
            const fuzzyQuery = new Parse.Query("AD4GD_Lake_Quality_Index");
            const allLakes = await fuzzyQuery.find();

            const currentName = lake.label.toLowerCase().trim();
            const possibleMatches = allLakes.filter((wqiLake) => {
              const lakeName = wqiLake.get("lake")?.toLowerCase().trim();
              return (
                lakeName?.includes(currentName) ||
                currentName.includes(lakeName)
              );
            });

            if (possibleMatches.length > 0) {
              const lakeObject = possibleMatches[0];
              const wqiStatus = lakeObject.get("WQI_status");
              realWQI = wqiStatus
                ? parseFloat(wqiStatus.toFixed(5))
                : undefined;
            }
          }

          return {
            ...lake,
            realWQI,
          };
        } catch (error) {
          // Silently handle errors for individual lakes
          return {
            ...lake,
            realWQI: undefined,
          };
        }
      })
    );

    return updatedLakes;
  };

  // Update lakes array when zones or wqiData changes
  useEffect(() => {
    const updateLakesWithWQI = async () => {
      const lakesOnly = zones.filter((zone) => zone.type === "lake");

      // First, create lakes with color data
      const lakesWithColors = lakesOnly.map((zone) => {
        const wqiInfo = wqiData[zone.id];
        return {
          ...zone,
          wqiColor: wqiInfo?.color,
          realWQI: undefined,
        };
      });

      // Then fetch real WQI values
      if (lakesWithColors.length > 0) {
        const lakesWithRealWQI = await fetchRealWQIValues(lakesWithColors);
        setLakes(lakesWithRealWQI);
      } else {
        setLakes(lakesWithColors);
      }
    };

    if (zones.length > 0) {
      updateLakesWithWQI();
    }
  }, [zones, wqiData]);

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
    const filteredOptions = lakes
      .filter((lake) => lake.label.toLowerCase().includes(value.toLowerCase()))
      .map((lake) => ({ value: lake.label }));

    setOptions(filteredOptions);
  };

  const handleSelect = (value: string) => {
    setSearchQuery(value);
  };

  const filteredZones = useMemo(() => {
    // Check if we have a specific search that matches exactly
    const selectedLake = lakes.find(
      (lake) => lake.label.toLowerCase() === searchQuery.toLowerCase()
    );

    if (selectedLake) {
      return [selectedLake];
    }

    // Filter lakes based on search query
    let filtered = lakes.filter((lake) =>
      lake.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply sorting if selected
    if (sortOrder !== "none" && filtered.length > 0) {
      filtered = filtered.sort((a, b) => {
        // Use real WQI values for sorting, with fallback handling
        const valueA = a.realWQI;
        const valueB = b.realWQI;

        // Handle cases where WQI values might not be available
        if (valueA == null && valueB == null) return 0; // Both null, equal
        if (valueA == null) return 1; // A is null, B comes first
        if (valueB == null) return -1; // B is null, A comes first

        if (sortOrder === "best-to-worst") {
          // For WQI, higher values typically mean better water quality
          return valueB - valueA; // Higher values (better quality) first
        } else {
          // worst-to-best
          return valueA - valueB; // Lower values (worse quality) first
        }
      });
    }

    return filtered;
  }, [lakes, searchQuery, sortOrder]);

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
                Wasserqualitätsindex
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <SortAscendingOutlined
                    style={{ color: "#42A456", fontSize: "16px" }}
                  />
                  <Text style={{ marginRight: "8px", fontSize: "14px" }}>
                    Sortieren:
                  </Text>
                  <Select
                    value={sortOrder}
                    onChange={setSortOrder}
                    style={{ width: 170, fontSize: "14px" }}
                    size="small"
                  >
                    <Option value="none">Keine Sortierung</Option>
                    <Option value="best-to-worst">Beste WQI</Option>
                    <Option value="worst-to-best">Schlechte WQI</Option>
                  </Select>
                </div>
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
                                  fill={item.wqiColor || "#8c8c8c"}
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
                ist nicht gedacht, um die Trophie direkt zu bestimmen. Vielmehr
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
