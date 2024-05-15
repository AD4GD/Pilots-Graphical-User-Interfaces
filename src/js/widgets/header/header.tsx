import { useTranslation } from "@opendash/core";

import { createWidgetComponent } from "@opendash/plugin-monitoring";

import { useDataService } from "@opendash/plugin-timeseries";
import React from "react";
import { ConfigInterface } from "./types";
import { Row, Col, Image, Button, Flex, Space, ConfigProvider } from "antd";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    //const DataService = useDataService();
    //context.setName(t("app:widgets.example.title"));

    context.setLoading(false);

    return (
      <div
        style={{ width: "100%", height: "100%", backgroundColor: "#D2FBEB" }}
      >
        <Row style={{ width: "100%" }}>
          <Col span={16}>
            <Image preview={false} src={require("./logo.svg")}></Image>
          </Col>
          <Col span={8}>
            <ConfigProvider
              wave={{ disabled: true }}
              theme={{
                token: {
                  colorPrimary: "#96F5D0",
                  colorTextLightSolid: "fff",
                  borderRadius: 6,
                  fontSize: 16,
                },
              }}
            >
              <Flex
                justify={"flex-end"}
                gap={"large"}
                style={{ padding: "3.5vh" }}
                align={"baseline"}
              >
                <Button type={"primary"} size={"large"}>
                  Übersicht Seen
                </Button>
                <Button type={"primary"} size={"large"}>
                  Favoriten
                </Button>
                <Button type={"primary"} size={"large"}>
                  Info
                </Button>
                <Image preview={false} src={require("./user.svg")}></Image>
              </Flex>
            </ConfigProvider>
          </Col>
        </Row>
      </div>
    );
  }
);
