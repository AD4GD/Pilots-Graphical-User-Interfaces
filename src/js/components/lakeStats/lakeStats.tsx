import { useTranslation } from "@opendash/core";
import { Col, Row, Typography } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import React, { useMemo } from "react";
import { useLocation, useParams } from "@opendash/router";
import { Carousel } from "../carousel";
import { StarFilled } from "@ant-design/icons";
import { IconBaseProps } from "@ant-design/icons/lib/components/Icon";
import { useLakeImages, useLakeMetaData } from "../../hooks/useLakeMetaData";
type LakeStats = {
  id: string;
  name: string;
  area: number;
  swimmingUsage: boolean;
  district: string;
  circumference: number;
  volume: number;
  averageDepth: number;
  maximumDepth: number;
};

interface PropertyRowProps {
  label: string;
  value: string | undefined;
}

interface IconLabelComponentProps {
  icon: React.ComponentType<IconBaseProps>;
  label: string;
}

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

const { Title, Text } = Typography;

const PropertyRow: React.FC<PropertyRowProps> = ({ label, value }) => (
  <Row>
    <Text style={{ flex: 0.35, fontSize: "15px", fontWeight: "600" }}>
      {label}:
    </Text>
    <Text style={{ flex: 0.65, fontSize: "15px" }}>{value}</Text>
  </Row>
);

const LakeStats: React.FC = ({}) => {
  const { lakeId } = useParams();
  const location = useLocation();
  const {
    item: { sensors },
  } = location.state || {};

  const t = useTranslation();

  const config = useMemo(() => {
    return {
      _sources: [],
      _items: [],
      _dimensions: [...sensors],
      _history: {},
    };
  }, [sensors]);

  // const properties = [
  //   {
  //     id: "N9vhwQrU8x",
  //     name: "Plötzensee",
  //     area: "76800 m2",
  //     swimmingUsage: "Ja",
  //     district: "Mitte",
  //     circumference: "1645,102 m",
  //     images: ["1", "2", "3"],
  //   },
  //   {
  //     id: "H7wRivfzrC",
  //     name: "Flughafensee",
  //     area: "30.6 ha",
  //     swimmingUsage: "tbd",
  //     district: "Reinickendorf",
  //     circumference: "3.545 km",
  //     images: ["1", "2", "3"],
  //   },
  //   {
  //     id: "DNuO9mBwVq",
  //     name: "Buckower Dorfteich",
  //     area: "tbd",
  //     swimmingUsage: "tbd",
  //     district: "Neukölln",
  //     circumference: "tbd",
  //     images: ["1", "2", "3"],
  //   },
  //   {
  //     id: "eiqVOoiri9",
  //     name: "Britzer Kirchteich",
  //     area: "tbd",
  //     swimmingUsage: "tbd",
  //     district: "Neukölln",
  //     circumference: "tbd",
  //     images: ["1", "2", "3"],
  //   },
  // ];

  const { result: properties } = useLakeMetaData();
  const currentLake = properties.find(
    (item) => item.geography?.id === lakeId
  ) || {
    id: undefined,
    name: "",
    area: 0,
    swimmingUsage: false,
    district: "",
    circumference: 0,
    volume: 0,
    averageDepth: 0,
    maximumDepth: 0,
  };
  const { result: images } = useLakeImages(currentLake?.id);
  console.log({ currentLake, images, properties });
  return (
    <>
      <Row style={{ width: "100%", height: "80px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-widget"
          config={""}
        ></WidgetStatic>
      </Row>
      <Row>
        <div
          style={{
            width: "30%",
            backgroundColor: "white",
          }}
        >
          <Title level={1} style={{ fontWeight: "bold", marginBottom: "2%" }}>
            {currentLake.name}
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
                {currentLake.name}
              </Text>
            </Col>
          </Row>

          <Carousel
            images={images.map((image) => [
              image.image._url,
              image.description,
            ])}
          />

          <div style={{ marginTop: "6%" }}>
            <PropertyRow label={t("Name")} value={currentLake.name} />
            <PropertyRow label={t("Fläche")} value={currentLake.area + " m²"} />
            <PropertyRow
              label={t("Badenutzung")}
              value={currentLake.swimmingUsage ? "Ja" : "Nein"}
            />
            <PropertyRow label={t("Bezirk")} value={currentLake.district} />
            <PropertyRow
              label={t("Umfang")}
              value={currentLake.circumference + " m"}
            />
            <PropertyRow
              label={t("Volumen")}
              value={currentLake.volume + " m³"}
            />
            <PropertyRow
              label={t("Durchnittliche Tiefe")}
              value={currentLake.averageDepth + " m"}
            />
            <PropertyRow
              label={t("Maximale Tiefe")}
              value={currentLake.maximumDepth + " m"}
            />
          </div>

          <IconLabelComponent
            icon={StarFilled}
            label="Als Favorit hinzufügen"
          />
        </div>

        <div
          style={{
            width: "64%",
            marginLeft: "2%",
            marginTop: "2%",
            marginRight: "2%",
            paddingLeft: "1%",
            paddingRight: "1%",
            paddingBottom: "2%",
            borderRadius: "20px",
            backgroundColor: "white",
          }}
        >
          <WidgetStatic type="lakeStats-widget" config={config}></WidgetStatic>
        </div>

        {/* <div
          style={{
            width: "64%",
            marginLeft: "2%",
            marginTop: "2%",
            marginRight: "2%",
            paddingLeft: "1%",
            paddingRight: "1%",
            borderRadius: "20px",
            height: "calc(30vh)",
            backgroundColor: "white",
          }}
        ></div> */}
      </Row>
    </>
  );
};

export default LakeStats;
