import React, { useEffect, useMemo, useState } from "react";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";
import { useUrlParam } from "@opendash/core";
import {
  Avatar,
  Button,
  Flex,
  Input,
  List,
  Row,
  Typography,
  AutoComplete,
} from "antd";
import { useNavigate } from "@opendash/router";
import { SearchOutlined } from "@ant-design/icons";

const { Search } = Input;

const { Title, Text } = Typography;

const LakeOverview: React.FC = () => {
  // const [lakeId, setLakeId] = useUrlParam(
  //   "lakeid",
  //   null as string | null,
  //   "string"
  // );
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
    console.log(item);
    navigate(`/lake/${item.id}`, { state: { item } });
  };

  const handleMapClick = async (id: string) => {
    try {
      const lakeQuery = new Parse.Query("MIAAS_Geographies").equalTo(
        "objectId",
        id
      );

      const results = await lakeQuery.find();

      if (results.length > 0) {
        const lake = results[0];

        console.log({
          type: lake.get("description"),
          label: lake.get("label"),
          sensors: lake.get("sensors"),
          id: id,
        });

        return {
          type: lake.get("description"),
          label: lake.get("label"),
          sensors: lake.get("sensors"),
          id: id,
        };
      } else {
        console.log("No lake found with the given id");
        return null;
      }
    } catch (error) {
      console.error("Error querying the lake:", error);
      return null;
    }
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

  const mapConfig = useMemo(() => {
    const config = {
      markers: [],
      zones: {
        type: "zones",
        districtsFromZones: zones.map((zone) => zone.id),
        districts: null,
        districtFromDimension: null,
      },
      _history: {
        aggregation: false,
      },
      onEvent: async (type: string, event: any) => {
        const objectId = event.features.filter(
          (f: any) => f.properties.description === "lake"
        )[0].properties.objectId;

        try {
          // Await the result from handleMapClick
          const lakeDetails = await handleMapClick(objectId);

          if (lakeDetails) {
            // Pass the lake details directly to handleNavigateToStats
            handleNavigateToStats(lakeDetails);
          } else {
            console.log("No lake details found.");
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      },
    };

    return config;
  }, [zones]);

  return (
    <>
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
              style={{ width: "100%", height: "100%" }}
              type="kpi-map"
              config={mapConfig}
            ></WidgetStatic>
          </Flex>

          <div
            style={{
              width: "33%",
              height: "100%",
              backgroundColor: "#E9ECEF",
              padding: "0 1rem",
            }}
          >
            <Row style={{ width: "100%" }}>
              <Title
                level={1}
                style={{
                  fontWeight: "bold",
                  marginBottom: "2rem",
                  fontFamily: "Josefin Sans",
                }}
              >
                Wasserqualitätindex
              </Title>
            </Row>

            <Row
              style={{
                marginBottom: "2rem",
              }}
            >
              <Text>
                Der Wasserqualitätsindex vergleicht die unten dargestellten Seen
                in Bezug auf ihre Wasserqualität basierend auf langfristigen
                Datenerhebungen.
              </Text>
            </Row>

            <Row>
              <Button
                type="link"
                style={{
                  color: "#42A456",
                  textDecoration: "underline",
                  marginBottom: "3rem",
                  padding: 0,
                }}
              >
                Mehr zur Datenerhebung
              </Button>
            </Row>

            <Row>
              <List
                style={{ width: "100%", height: "100%" }}
                itemLayout="horizontal"
                dataSource={filteredZones}
                size="small"
                split={false}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            <svg width="12" height="12">
                              <circle cx="6" cy="6" r="6" fill="#55b169" />
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
                      // description={item.id}
                      description={"See"}
                    />
                  </List.Item>
                )}
              />
            </Row>
          </div>
        </Flex>
      </Row>
    </>
  );
};

export default LakeOverview;
