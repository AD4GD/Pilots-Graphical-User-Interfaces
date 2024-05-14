import React from "react";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";
import { Typography, Row, Col } from "antd";
// import { Icon } from "@ant-design/icons";

import { ConfigInterface } from "./types";
import { Carousel } from "../../components/carousel";

interface PropertyRowProps {
  label: string;
  value: string;
}

interface LabelIconProps {
  label: string;
  icon: string;
}

const { Title, Text } = Typography;

const PropertyRow: React.FC<PropertyRowProps> = ({ label, value }) => (
  <Row>
    <Text style={{ flex: 0.35, fontSize: "15px", fontWeight: "600" }}>
      {label}:
    </Text>
    <Text style={{ flex: 0.65, fontSize: "15px" }}>{value}</Text>
  </Row>
);

const LabelIcon: React.FC<LabelIconProps> = ({ label, icon }) => (
  <Row>
    {/* <Icon
      type={icon}
      style={{ fontSize: "16px", color: "#08c" }}
      theme="outlined"
    /> */}

    <Text style={{ flex: 0.35, fontSize: "15px", fontWeight: "600" }}>
      {label}:
    </Text>
  </Row>
);

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context.setLoading(false);
    // const DataService = useDataService();

    // console.log("DataService", DataService);

    const properties = {
      name: "Plötzensee",
      area: "76800 m2",
      swimmingUsage: "Ja",
      district: "Mitte",
      circumference: "1645,102 m",
      images: ["1", "2", "3"],
    };

    return (
      <div style={{ padding: "4%" }}>
        <Title level={1} style={{ fontWeight: "bold", marginBottom: "2%" }}>
          {properties?.name}
        </Title>
        <Row>
          <Col
            style={{
              alignSelf: "center",
            }}
          >
            <svg width="12" height="12">
              <circle cx="6" cy="6" r="6" fill="#55b169" />
            </svg>
            <Text
              strong
              style={{
                lineHeight: 0,
                fontSize: "15px",
                marginLeft: "5px",
              }}
            >
              {properties?.name} I ggf. Zusatzinfos wie Zahl?
            </Text>
          </Col>
        </Row>

        <Carousel images={properties?.images} />
        <Title level={5} style={{ fontWeight: "bold" }}>
          Bildbeschreibung zum obenstehenden Bild
        </Title>

        <div style={{ marginTop: "6%" }}>
          <PropertyRow label={t("Name")} value={properties?.name} />
          <PropertyRow label={t("Fläche")} value={properties?.area} />
          <PropertyRow
            label={t("Badenutzung")}
            value={properties?.swimmingUsage}
          />
          <PropertyRow label={t("Bezirk")} value={properties?.district} />
          <PropertyRow label={t("Umfang")} value={properties?.circumference} />
        </div>

        {/* <LabelIcon label="fadsfdasf" icon="noting" /> */}
      </div>
    );
  }
);
