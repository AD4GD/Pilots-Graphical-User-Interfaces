import { useTranslation } from "@opendash/core";
import { Col, Row, Typography } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "@opendash/router";
import { StarFilled } from "@ant-design/icons";
import { IconBaseProps } from "@ant-design/icons/lib/components/Icon";
import { useLakeMetaData } from "../../hooks/useLakeMetaData";
import Parse from "parse";
import MultiColorBar from "../multicolorbar/multicolorbar";
import CustomCarousel from "../carousel/carousel";

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

interface MapItem {
  layerUrls: string[];
  title: string;
}

const LakeStats: React.FC = ({}) => {
  const { lakeId } = useParams();
  const location = useLocation();
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [bbox, setBbox] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    item: { sensors },
  } = location.state || {};

  const t = useTranslation();

  const updateBbox = (newBbox: string) => {
    setBbox(newBbox);
  };

  useEffect(() => {
    // Fetch bbox and other details from Parse server
    const fetchBoundingBox = async () => {
      setLoading(true);
      setError("");

      try {
        const query = new Parse.Query("MIAAS_Geographies");
        query.equalTo("objectId", lakeId);
        const result = await query.first();

        if (result) {
          const bbox = result.get("bbox");
          const newMapItems = [
            {
              layerUrls: [
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_fb_btwert?service=wms&request=getmap&version=1.3.0&layers=0&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_fb_btwert?service=wms&request=getmap&version=1.3.0&layers=1&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
              ],
              title: "Biotoptypen: Biotopwerte",
            },
            {
              layerUrls: [
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k06_05gruenversorg2016?service=wms&request=getmap&version=1.3.0&layers=0&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k06_05gruenversorg2016?service=wms&request=getmap&version=1.3.0&layers=1&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k06_05gruenversorg2016?service=wms&request=getmap&version=1.3.0&layers=2&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
              ],
              title:
                "Versorgung mit öffentlichen, wohnungsnahen Grünanlagen 2016",
            },
            {
              layerUrls: [
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=0&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=1&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=2&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=3&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=4&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=5&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=6&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=7&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=11&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
                `https://fbinter.stadt-berlin.de/fb/wms/senstadt/nsg_lsg?service=wms&request=getmap&version=1.3.0&layers=12&styles=&crs=EPSG:4326&bbox=${bbox}&width=1598&height=952&format=image/png&transparent=true`,
              ],
              title:
                "Schutzgebiete und Schutzobjekte nach Naturschutzrecht Berlin (inklusive Natura 2000)",
            },
          ];

          setMapItems(newMapItems);
          setBbox(bbox);
        } else {
          setError("Lake data not found.");
        }
      } catch (err) {
        setError("Failed to fetch bounding box data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoundingBox();
  }, [lakeId]);

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

  const [wqiValues, setWqiValues] = useState({
    minVal: 0,
    maxVal: 100,
    minTrend: 0,
    maxTrend: 100,
    value: 0,
    trend: 0,
  });

  const getWQI = async () => {
    if (lakeId) {
      // Query to get the maximum value
      const wqiQuery = new Parse.Query("AD4GD_Lake_Quality_Index");

      // Get the maximum value (descending order)
      const maxResults = await wqiQuery
        .select("WQI_status")
        .descending("WQI_status")
        .limit(1)
        .find();

      // Get the minimum value (ascending order)
      const minResults = await wqiQuery
        .select("WQI_status")
        .ascending("WQI_status")
        .limit(1)
        .find();

      const maxResultsTrend = await wqiQuery
        .select("WQI_trend")
        .descending("WQI_trend")
        .limit(1)
        .find();

      const minResultsTrend = await wqiQuery
        .select("WQI_trend")
        .ascending("WQI_trend")
        .limit(1)
        .find();

      const round = (value: number, decimals: number) =>
        value !== null ? parseFloat(value.toFixed(decimals)) : null;

      const maxValue =
        maxResults.length > 0
          ? round(maxResults[0].get("WQI_status"), 2)
          : null;

      const minValue =
        minResults.length > 0
          ? round(minResults[0].get("WQI_status"), 2)
          : null;

      const maxTrend =
        maxResultsTrend.length > 0
          ? round(maxResultsTrend[0].get("WQI_trend"), 2)
          : null;

      const minTrend =
        minResultsTrend.length > 0
          ? round(minResultsTrend[0].get("WQI_trend"), 2)
          : null;

      // Query to get the value of current lake
      const query = new Parse.Query("AD4GD_Lake_Quality_Index");
      query.equalTo("lake", currentLake.name);
      const results = await query.find();

      if (results.length > 0) {
        const lakeObject = results[0];
        const wqiStatus = round(lakeObject.get("WQI_status"), 2);
        const wqiTrend = round(lakeObject.get("WQI_trend"), 2);

        // Set the state with the rounded values
        setWqiValues({
          minVal: minValue || 0,
          maxVal: maxValue || 100,
          minTrend: minTrend || 0,
          maxTrend: maxTrend || 100,
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

          {/* ########################################################### */}
          <CustomCarousel maps={mapItems} bbox={bbox} updateBbox={updateBbox} />

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
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: "100%",
              gap: "1%",
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
                  paddingLeft: "4%",
                }}
              >
                Earth Observation Trophic State
              </Typography.Title>
              <div style={{ width: "100%", height: "100%", margin: "0 auto" }}>
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <span
                            style={{ fontSize: "20px", fontWeight: "bold" }}
                          >
                            WQI State: {wqiValues.value}
                          </span>
                        </div>
                      </div>
                      <MultiColorBar
                        minValue={wqiValues.minVal}
                        maxValue={wqiValues.maxVal}
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
                  paddingLeft: "4%",
                }}
              >
                Earth Observation Trophic Trend
              </Typography.Title>
              <div style={{ width: "100%", height: "100%", margin: "0 auto" }}>
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "1rem",
                          }}
                        >
                          <span
                            style={{ fontSize: "20px", fontWeight: "bold" }}
                          >
                            WQI Trend: {wqiValues.trend}
                          </span>
                        </div>
                      </div>
                      <MultiColorBar
                        minValue={wqiValues.minTrend}
                        maxValue={wqiValues.maxTrend}
                        value={wqiValues.trend}
                      />
                    </>
                  ) : (
                    <p>Loading WQI data...</p>
                  )}
                </div>
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
