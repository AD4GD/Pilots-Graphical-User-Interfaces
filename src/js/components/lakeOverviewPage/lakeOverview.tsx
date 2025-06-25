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
} from "antd";
import { useNavigate } from "@opendash/router";
import { SearchOutlined } from "@ant-design/icons";
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
                }}
              >
                Wasserqualitätindex
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
                  onClick={fetchData}
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
      </ConfigProvider>
    </>
  );
};

export default LakeOverview;
