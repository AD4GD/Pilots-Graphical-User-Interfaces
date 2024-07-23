import React from "react";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";
import { Typography, Row, Col } from "antd";
import { EditOutlined, StarFilled } from "@ant-design/icons";
import { IconBaseProps } from "@ant-design/icons/lib/components/Icon";

import { ConfigInterface } from "./types";
import { Carousel } from "../../components/carousel";

const { Title, Text, Link } = Typography;

interface PropertyRowProps {
  label: string;
  value: string;
}

interface IconLabelComponentProps {
  icon: React.ComponentType<IconBaseProps>;
  label: string;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, value }) => (
  <Row>
    <Text style={{ flex: 0.35, fontSize: "15px", fontWeight: "600" }}>
      {label}:
    </Text>
    <Text style={{ flex: 0.65, fontSize: "15px" }}>{value}</Text>
  </Row>
);

const IconLabelComponent: React.FC<IconLabelComponentProps> = ({
  icon: Icon,
  label,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: "4%" }}>
      <div>
        <Icon
          style={{
            fontSize: "20px",
            padding: "6px",
            backgroundColor: "#56ECAD",
            borderRadius: "50%",
          }}
        />
      </div>
      <Text style={{ fontSize: "16px", fontWeight: "600", marginLeft: "5%" }}>
        {label}
      </Text>
    </div>
  );
};

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
      <div style={{ padding: "4%", flexGrow: 1 }}>
        <Link
          style={{
            color: "#42A456",
            fontSize: "16px",
            display: "flex",
            flex: 0.65,
            alignItems: "center",
            justifyContent: "space-between",
          }}
          // href="javascript:history.back()"
          underline
        >
          {"<"} Zurück zur Übersicht
        </Link>
        <Title
          level={1}
          style={{ fontWeight: "bold", marginBottom: "2%", marginTop: "2%" }}
        >
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

        <div style={{ marginTop: "4%" }}>
          <PropertyRow label={t("Name")} value={properties?.name} />
          <PropertyRow label={t("Fläche")} value={properties?.area} />
          <PropertyRow
            label={t("Badenutzung")}
            value={properties?.swimmingUsage}
          />
          <PropertyRow label={t("Bezirk")} value={properties?.district} />
          <PropertyRow label={t("Umfang")} value={properties?.circumference} />
        </div>

        <IconLabelComponent icon={StarFilled} label="Als Favorit hinzufügen" />
      </div>
    );
  }
);
