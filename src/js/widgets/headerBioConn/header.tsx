import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";
import { Row, Col, Divider, Typography, Space } from "antd";
import { useNavigate } from "@opendash/router";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();
    context.setLoading(false);
    const navigate = useNavigate();

    return (
      <Row
        style={{ width: "100%", height: "80px", backgroundColor: "#D2FBEB" }}
        align="middle"
      >
        <Col
          span={16}
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: "1%",
          }}
        >
          <Typography.Title
            level={2}
            style={{
              margin: 0,
              color: "#000",
              letterSpacing: "4px", // Increased letter spacing
            }}
          >
            BioConnect
          </Typography.Title>
          <Divider
            type="vertical"
            style={{ height: "40px", margin: "0 16px" }}
          />
          <Space>
            <Typography.Link
              strong
              style={{ fontSize: "16px", color: "#000" }}
              onClick={() => navigate("/bioconnect")}
            >
              Connectivity Map
            </Typography.Link>
            <Divider
              type="vertical"
              style={{ height: "40px", margin: "0 16px" }}
            />
            <Typography.Link
              strong
              style={{ fontSize: "16px", color: "#000" }}
              // onClick={() => navigate("/about")}
            >
              About
            </Typography.Link>
          </Space>
        </Col>
      </Row>
    );
  }
);
