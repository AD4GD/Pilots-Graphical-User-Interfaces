import { useTranslation } from "@opendash/core";
import { Col, Row, Typography } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "@opendash/router";
import { Carousel } from "../carousel";
import {
  StarFilled,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { IconBaseProps } from "@ant-design/icons/lib/components/Icon";
import { useLakeImages, useLakeMetaData } from "../../hooks/useLakeMetaData";
import MultiColorProgressbar from "multi-color-progressbar-with-indicator";
import "multi-color-progressbar-with-indicator/dist/index.css";
import Parse from "parse";

// interface Geography {
//   id: string;
// }

// type LakeStatsType = {
//   id: string;
//   name: string;
//   area: number;
//   swimmingUsage: boolean;
//   district: string;
//   circumference: number;
// };

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

  const wqiBars = [
    { width: 30, color: "#dc3545" },
    { width: 40, color: "#f2d261" },
    { width: 30, color: "#6fa053" },
  ];

  const [wqiValues, setWqiValues] = useState({
    minVal: 0,
    maxVal: 1000,
    value: 0,
    trend: 0,
  });

  const getWQI = async () => {
    if (lakeId) {
      // Query to get the maximum value
      const maxQuery = new Parse.Query("AD4GD_Lake_Quality_Index");
      const maxResults = await maxQuery
        .select("WQI_status")
        .ascending("WQI_status")
        .limit(1)
        .find();

      const maxValue =
        maxResults.length > 0 ? maxResults[0].get("WQI_status") : null;

      // Query to get the minimum value
      const minQuery = new Parse.Query("AD4GD_Lake_Quality_Index");
      const minResults = await minQuery
        .select("WQI_status")
        .descending("WQI_status")
        .limit(1)
        .find();

      const minValue =
        minResults.length > 0 ? minResults[0].get("WQI_status") : null;

      // Query to get the value of current lake
      const query = new Parse.Query("AD4GD_Lake_Quality_Index");
      query.equalTo("lake", currentLake.name);
      const results = await query.find();

      if (results.length > 0) {
        const lakeObject = results[0];
        const wqiStatus = lakeObject.get("WQI_status");
        const wqiTrend = lakeObject.get("WQI_trend");

        // Set the state with the values
        setWqiValues({
          minVal: minValue || 0,
          maxVal: maxValue || 1000,
          value: wqiStatus || 0,
          trend: wqiTrend || 0,
        });
      } else {
        console.log(`No lake found with the name: ${currentLake.name}`);
      }
    }
  };

  useEffect(() => {
    if (currentLake.name) {
      getWQI();
    }
  }, [currentLake.name]);

  const renderWQIArrow = () => {
    if (wqiValues.trend > 0) {
      return (
        <ArrowUpOutlined
          style={{ color: "green", fontSize: "20px", marginRight: "5px" }}
        />
      );
    } else if (wqiValues.trend < 0) {
      return (
        <ArrowDownOutlined
          style={{ color: "red", fontSize: "20px", marginRight: "5px" }}
        />
      );
    }
    return null;
  };
  const config = useMemo(() => {
    return {
      _sources: [],
      _items: [],
      _dimensions: [...sensors],
      _history: {},
    };
  }, [sensors]);

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
          <Title
            level={1}
            style={{
              fontWeight: "bold",
              marginBottom: "2%",
              paddingLeft: "1rem",
            }}
          >
            {currentLake.name}
          </Title>
          <Row>
            <Col
              style={{
                alignSelf: "center",
                paddingLeft: "1rem",
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

          <div style={{ marginTop: "6%", paddingLeft: "1rem" }}>
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
            width: "68%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2%",
            marginLeft: "1%",
            marginTop: "1%",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "40%",
              marginBottom: "1%",
              borderRadius: "20px",
              backgroundColor: "white",
            }}
          >
            <Typography.Title
              level={4}
              style={{
                fontWeight: "bold",
                paddingTop: "2%",
                paddingLeft: "2%",
              }}
            >
              Water Quality Index
            </Typography.Title>
            <div style={{ width: "50%", height: "100%", margin: "0 auto" }}>
              <div
                style={{
                  padding: "5% 15% 15% 15%",
                }}
              >
                {wqiValues.value !== 0 ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                          WQI: {wqiValues.value}
                        </span>
                      </div>

                      <span style={{ fontSize: "16px", color: "#555" }}>
                        Trend: {wqiValues.trend}
                        {renderWQIArrow()}
                      </span>
                    </div>
                    <MultiColorProgressbar
                      height={30}
                      bars={wqiBars}
                      minVal={wqiValues.minVal}
                      maxVal={wqiValues.maxVal}
                      value={wqiValues.value}
                    />
                  </>
                ) : (
                  <p>Loading WQI data...</p>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              borderRadius: "20px",
              backgroundColor: "white",
              padding: "1% 2%",
            }}
          >
            <WidgetStatic
              type="lakeStats-widget"
              config={config}
            ></WidgetStatic>
          </div>
        </div>
      </Row>
    </>
  );
};

export default LakeStats;
