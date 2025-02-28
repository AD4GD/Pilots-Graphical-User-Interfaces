import { useTranslation } from "@opendash/core";

import { createWidgetComponent } from "@opendash/plugin-monitoring";

import React from "react";
import { ConfigInterface } from "./types";
import { useNavigate } from "@opendash/router";
import { Layout, Typography, Divider } from "antd";

const { Header } = Layout;
const { Text } = Typography;

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context.setLoading(false);

    const navigate = useNavigate();

    const headerStyle = {
      backgroundColor: "#D9D9D9",
      display: "flex",
      alignItems: "center",
      padding: "0 24px", // Add some padding for spacing
    };

    const textStyle = {
      cursor: "pointer",
      margin: "0 16px", // Add spacing between clickable texts
    };

    const handleConnectivityMapClick = () => {
      console.log("Connectivity Map clicked");
      // Add your navigation or logic here
    };

    const handleAboutClick = () => {
      console.log("About clicked");
      // Add your navigation or logic here
    };

    return (
      <Header style={headerStyle}>
        <Text strong style={{ fontSize: "18px", marginRight: "16px" }}>
          BioConnect
        </Text>
        <Divider type="vertical" style={{ height: "24px", margin: "0 16px" }} />
        <Text style={textStyle} onClick={handleConnectivityMapClick}>
          Connectivity Map
        </Text>
        <Text style={textStyle} onClick={handleAboutClick}>
          About
        </Text>
      </Header>
    );
  }
);
