import { useTranslation } from "@opendash/core";

import { createWidgetComponent } from "@opendash/plugin-monitoring";

import React from "react";
import { ConfigInterface } from "./types";
import { Row, Col, Image, Button, Flex, ConfigProvider } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "@opendash/router";
import { Icon } from "@opendash/icons";
import { $framework } from "@opendash/core";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context.setLoading(false);

    const navigate = useNavigate();

    const isAdmin =
      $framework.services.UserService.hasPermission("parse-admin");

    return (
      <Row
        style={{ width: "100%", height: "80px", backgroundColor: "#D2FBEB" }}
      >
        <Col
          span={16}
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "1%",
          }}
        >
          <Image
            preview={false}
            src={require("./logo.png")}
            style={{
              maxWidth: "100%",
              maxHeight: "80px",
              width: "auto",
              height: "auto",
              margin: "auto",
            }}
          ></Image>
        </Col>

        <Col span={8}>
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
            <Flex
              justify="flex-end"
              gap="large"
              align="center"
              style={{ height: "100%", marginRight: "3rem" }}
            >
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  navigate("/splashboard");
                }}
              >
                Übersicht Seen
              </Button>

              <Button
                type="primary"
                size="large"
                onClick={() => {
                  navigate("/splashboard/lake/favourite");
                }}
              >
                Favoriten
              </Button>

              <Button
                type="primary"
                size="large"
                onClick={() => {
                  navigate("/splashboard/info");
                }}
              >
                Info
              </Button>

              {isAdmin && (
                <Button
                  type="primary"
                  size="large"
                  style={{ minWidth: "50px" }}
                  icon={<Icon icon="fa:database" />}
                  onClick={() => {
                    // navigate("/admin/ow/sensors");
                    navigate("/admin/parse/MIAAS_Geographies");
                  }}
                ></Button>
              )}

              {isAdmin && (
                <Button
                  type="primary"
                  size="large"
                  style={{ minWidth: "50px" }}
                  icon={<Icon icon="fa:upload" />}
                  onClick={() => {
                    navigate("/upload");
                  }}
                ></Button>
              )}

              <Button
                type="primary"
                size="large"
                style={{ minWidth: "50px" }}
                icon={<UserOutlined />}
                onClick={() => {
                  $framework.services.UserService.logout();
                }}
              ></Button>
            </Flex>
          </ConfigProvider>
        </Col>
      </Row>
    );
  }
);
