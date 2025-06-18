import React from "react";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import { $framework } from "@opendash/core";
import i18next from "i18next";

import { Row, Col, Image, Button, Flex, ConfigProvider, Select } from "antd";
import { UserOutlined, GlobalOutlined } from "@ant-design/icons";
import { Icon } from "@opendash/icons";

import { ConfigInterface } from "./types";
import "./header.css";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();
    const navigate = useNavigate();

    context.setLoading(false);

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
          />
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
                onClick={() => navigate("/splashboard")}
              >
                Übersicht Seen
              </Button>

              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/splashboard/lake/favourite")}
              >
                Favoriten
              </Button>

              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/splashboard/info")}
              >
                Info
              </Button>

              {isAdmin && (
                <Button
                  type="primary"
                  size="large"
                  style={{ minWidth: "50px" }}
                  icon={<Icon icon="fa:database" />}
                  onClick={() => navigate("/admin/parse/MIAAS_Geographies")}
                />
              )}

              {isAdmin && (
                <Button
                  type="primary"
                  size="large"
                  style={{ minWidth: "50px" }}
                  icon={<Icon icon="fa:upload" />}
                  onClick={() => navigate("/splashboard/upload")}
                />
              )}

              {/* 🌐 Language Switcher - Styled to match header */}
              {/* <Select
                value={i18next.language}
                onChange={(lng) => i18next.changeLanguage(lng)}
                suffixIcon={
                  <GlobalOutlined style={{ color: "#000", fontSize: 20 }} />
                }
                style={{
                  background: "#96F5D0",
                  color: "#000",
                  fontWeight: 700,
                  minWidth: 80,
                  borderRadius: 6,
                  height: 40,
                  fontSize: 16,
                  transition: "border-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                }}
                dropdownStyle={{
                  background: "#96F5D0",
                  color: "#000",
                  borderRadius: 6,
                }}
                className="custom-lang-select"
                optionLabelProp="label"
                options={[
                  {
                    value: "en",
                    label: (
                      <span style={{ color: "#000", fontWeight: 700 }}>EN</span>
                    ),
                  },
                  {
                    value: "de",
                    label: (
                      <span style={{ color: "#000", fontWeight: 700 }}>DE</span>
                    ),
                  },
                ]}
                popupMatchSelectWidth={false}
              /> */}

              <Button
                type="primary"
                size="large"
                style={{ minWidth: "50px" }}
                icon={<UserOutlined />}
                onClick={() => {
                  $framework.services.UserService.logout();
                }}
              />
            </Flex>
          </ConfigProvider>
        </Col>
      </Row>
    );
  }
);
