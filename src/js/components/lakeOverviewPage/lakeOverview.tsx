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

  const handleClick = (item: { type: string; label: string; id: string }) => {
    navigate("/lake", { state: { item } });
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
      onEvent: (type: string, event: any) => {
        console.log({ type, event });
        // console.log(
        //   "ID of clicked Features",
        //   // event.features.map((f: any) => f.properties.objectId)
        //   event.features.filter(
        //     (f: any) => f.properties.description === "lake"
        //   )[0].properties.objectId
        // );
        navigate(
          `/lake/${
            event.features.filter(
              (f: any) => f.properties.description === "lake"
            )[0].properties.objectId
          }`
        );
      },
    };

    return config;
  }, [zones]);

  // const mapConfig = useMemo(() => {
  //   const config = {
  //     markers: [],
  //     zones: {
  //       type: "zones",
  //       districtsFromZones: filteredZones.map((zone) => zone.id),
  //       districts: null,
  //       districtFromDimension: null,
  //     },
  //     _history: {
  //       aggregation: false,
  //     },
  //     onEvent: (type: string, event: any) => {
  //       console.log({ type, event });
  //       console.log(
  //         "ID of clicked Features",
  //         event.features.filter(
  //           (f: any) => f.properties.description === "lake"
  //         )[0].properties.objectId
  //       );
  //     },
  //   };

  //   return config;
  // }, [filteredZones]);

  return (
    <>
      {/* {!lakeId && (
        <>
          <WidgetStatic
            style={{ height: "100vh" }}
            type="kpi-map"
            config={config}
          ></WidgetStatic>
          <Button
            onClick={() => {
              setLakeId("adljbngoqe");
            }}
          >
            {" "}
          </Button>
        </>
      )}
      {lakeId && <h1>Details of lake with id {lakeId}</h1>} */}

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
                      // title={<a href={`/lake/${item.id}`}>{item.label}</a>}
                      title={
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default anchor behavior
                            handleClick(item); // Handle the click to navigate and pass props
                          }}
                        >
                          {item.label}
                        </a>
                      }
                      description={item.id}
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
