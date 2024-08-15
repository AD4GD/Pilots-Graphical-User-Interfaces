import React, { useEffect, useMemo, useState } from "react";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";
import { useNavigation, useUrlParam } from "@opendash/core";
import { Avatar, Button, Flex, Input, List, Row, Typography } from "antd";
import { useNavigate } from "@opendash/router";

const { Search } = Input;

const { Title, Text } = Typography;

const LakeOverview = () => {
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
        console.log(
          "ID of clicked Features",
          // event.features.map((f: any) => f.properties.objectId)
          event.features.filter(
            (f: any) => f.properties.description === "lake"
          )[0].properties.objectId
        );
      },
    };

    return config;
  }, [zones]);

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
                fontFamily: "Josefin Sans",
              }}
            >
              Kleine Seen in Berlin
            </Title>

            <Search
              placeholder="See suchen..."
              onSearch={() => console.log("hi")}
              style={{ width: 250, marginBottom: "1rem" }}
            />

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
                dataSource={zones.filter((z) => z.type === "lake")}
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
                      title={<a href="">{item.label}</a>}
                      description={"lake"}
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
