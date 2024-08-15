import { useTranslation } from "@opendash/core";
import React, { useEffect, useMemo, useState } from "react";
import {
  createWidgetComponent,
  WidgetStatic,
} from "@opendash/plugin-monitoring";
import { ConfigInterface } from "./types";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";

import { Row, Col, Flex, Input, Typography, List, Avatar } from "antd";
import { useParams } from "@opendash/router";

const { Search } = Input;

const { Title, Text } = Typography;

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context.setLoading(false);

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
      console.log("Zones set:", zones);
    };

    // Query Lake Meta Data

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
        <Flex
          gap="middle"
          align="start"
          style={{ padding: "0 1rem", width: "100%", height: "100%" }}
        >
          <div style={{ width: "67%", height: "100%" }}>
            <Title level={1} style={{ fontWeight: "bold", marginBottom: "2%" }}>
              Kleine Seen in Berlin
            </Title>

            <Search
              placeholder="See suchen..."
              onSearch={() => console.log("hi")}
              style={{ width: 200, marginBottom: "1rem" }}
            />

            <WidgetStatic
              style={{ width: "100%", height: "100%" }}
              type="kpi-map"
              config={mapConfig}
            ></WidgetStatic>
          </div>

          <div
            style={{
              width: "33%",
              height: "100%",
              backgroundColor: "#E9ECEF",
              padding: "1rem",
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
              <a
                style={{
                  color: "#42A456",
                  textDecoration: "underline",
                  marginBottom: "3rem",
                }}
              >
                <Text type="success">Mehr zur Datenerhebung</Text>
              </a>
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
      </>
    );
  }
);
