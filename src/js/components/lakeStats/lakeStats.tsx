import { useTranslation } from "@opendash/core";
import {
  Button,
  Col,
  ConfigProvider,
  Row,
  Typography,
  Collapse,
  CollapseProps,
  message,
  Modal,
} from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "@opendash/router";
import { StarFilled, InfoCircleOutlined } from "@ant-design/icons";
import { IconBaseProps } from "@ant-design/icons/lib/components/Icon";
import { useLakeMetaData } from "../../hooks/useLakeMetaData";
import Parse from "parse";
import MultiColorBar from "../multicolorbar/multicolorbar";
import CustomCarousel from "../carousel/carousel";
import { Notes } from "../Notes";

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

const text = `tbd
`;

const items: CollapseProps["items"] = [
  {
    key: "1",
    label: "Wasserstand Werte",
    children: <p>{text}</p>,
  },
  {
    key: "2",
    label: "Temperatur Werte",
    children: <p>{text}</p>,
  },
];

const LakeStats: React.FC = ({}) => {
  const { lakeId } = useParams();
  const location = useLocation();
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [bbox, setBbox] = useState("");
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
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
        // query for bbox
        const geoQuery = new Parse.Query("MIAAS_Geographies");
        geoQuery.equalTo("objectId", lakeId);
        const geoResult = await geoQuery.first();

        if (!geoResult) {
          throw new Error("Lake geography not found");
        }

        const bbox = geoResult.get("bbox");
        if (!bbox) {
          throw new Error("Bounding box not available for this lake");
        }

        // query for layer
        const layerQuery = new Parse.Query("AD4GD_LakeLayers");
        const layerResults = await layerQuery.find();

        const newMapItems = layerResults.map((layer) => {
          const baseUrl = layer.get("layersUrl");
          const layersArray = layer.get("layersArray");
          const title = layer.get("layersTitle");
          const legend = layer.get("layersLegend");

          // Construct URLs for each layer number
          const layerUrls = layersArray.map((layerNum: string) => {
            // Handle URL with or without existing parameters
            return `${baseUrl}&layers=${layerNum}&bbox=${bbox}`;
          });

          // console.log("Layer URLs:", layerUrls);
          return {
            layerUrls,
            title,
            legend: legend instanceof Parse.File ? legend.url() : legend,
          };
        });

        setMapItems(newMapItems);
        setBbox(bbox);
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

  const currentLakeMeta = properties.find(
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
          ? round(maxResults[0].get("WQI_status"), 5)
          : null;

      const minValue =
        minResults.length > 0
          ? round(minResults[0].get("WQI_status"), 5)
          : null;

      const maxTrend =
        maxResultsTrend.length > 0
          ? round(maxResultsTrend[0].get("WQI_trend"), 5)
          : null;

      const minTrend =
        minResultsTrend.length > 0
          ? round(minResultsTrend[0].get("WQI_trend"), 5)
          : null; // Query to get the value of current lake
      const query = new Parse.Query("AD4GD_Lake_Quality_Index");
      query.equalTo("lake", currentLakeMeta.name);
      const results = await query.find();

      if (results.length > 0) {
        const lakeObject = results[0];
        const wqiStatus = round(lakeObject.get("WQI_status"), 5);
        const wqiTrend = round(lakeObject.get("WQI_trend"), 5);

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
        // Try fuzzy matching
        const fuzzyQuery = new Parse.Query("AD4GD_Lake_Quality_Index");
        const allLakes = await fuzzyQuery.find();

        const currentName = currentLakeMeta.name.toLowerCase().trim();
        const possibleMatches = allLakes.filter((lake) => {
          const lakeName = lake.get("lake")?.toLowerCase().trim();
          return (
            lakeName?.includes(currentName) || currentName.includes(lakeName)
          );
        });

        if (possibleMatches.length > 0) {
          const lakeObject = possibleMatches[0];
          const wqiStatus = round(lakeObject.get("WQI_status"), 5);
          const wqiTrend = round(lakeObject.get("WQI_trend"), 5);

          setWqiValues({
            minVal: minValue || 0,
            maxVal: maxValue || 100,
            minTrend: minTrend || 0,
            maxTrend: maxTrend || 100,
            value: wqiStatus || 0,
            trend: wqiTrend || 0,
          });
        }
      }
    }
  };
  // Function to calculate WQI color (same logic as multicolorbar)
  const getWQIColor = (
    value: number,
    minValue: number,
    maxValue: number
  ): string => {
    // If no valid WQI data, return grey color
    if (value === 0 && minValue === 0 && maxValue === 100) {
      return "#8c8c8c"; // Grey for no data
    }

    // Clamp the value within the min and max range
    const clampedValue = Math.max(minValue, Math.min(value, maxValue));

    // Calculate the percentage position
    const percentage =
      ((clampedValue - minValue) / (maxValue - minValue)) * 100;

    // Gradient color stops (same as multicolorbar)
    const gradientColors = [
      { stop: 0, color: "#dc3545" }, // Red
      { stop: 30, color: "#f2d261" }, // Yellow
      { stop: 70, color: "#6fa053" }, // Green
    ];

    // Find the appropriate color range
    for (let i = 0; i < gradientColors.length - 1; i++) {
      const start = gradientColors[i];
      const end = gradientColors[i + 1];

      if (percentage >= start.stop && percentage <= end.stop) {
        const ratio = (percentage - start.stop) / (end.stop - start.stop);
        return interpolateColor(start.color, end.color, ratio);
      }
    }
    return gradientColors[gradientColors.length - 1].color;
  };

  const interpolateColor = (
    color1: string,
    color2: string,
    ratio: number
  ): string => {
    const hex = (color: string) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 255;
    const g1 = (hex(color1) >> 8) & 255;
    const b1 = hex(color1) & 255;

    const r2 = (hex(color2) >> 16) & 255;
    const g2 = (hex(color2) >> 8) & 255;
    const b2 = hex(color2) & 255;

    const r = Math.round(r1 + ratio * (r2 - r1));
    const g = Math.round(g1 + ratio * (g2 - g1));
    const b = Math.round(b1 + ratio * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
  };

  useEffect(() => {
    if (currentLakeMeta.name) {
      getWQI();
    }
  }, [currentLakeMeta.name]);

  const config = useMemo(() => {
    return {
      _sources: ["ad4gd_private"],
      _items: ["flag"],
      _dimensions: [...sensors],
      _history: {},
    };
  }, [sensors]);

  const handleAddFavorite = async (itemId: string) => {
    const user = Parse.User.current();
    if (!user) {
      message.error("You must be logged in!");
      return false;
    }

    try {
      // First check if this lake is already favorited by the user
      const FavoriteLake = Parse.Object.extend("AD4GD_FavouriteLake");
      const checkQuery = new Parse.Query(FavoriteLake);

      const Lake = Parse.Object.extend("MIAAS_Geographies");
      const lakePointer = new Lake();
      lakePointer.id = itemId;

      checkQuery.equalTo("user", user);
      checkQuery.equalTo("lake", lakePointer);

      const existingFavorite = await checkQuery.first();

      if (existingFavorite) {
        message.error("This lake is already in your favorites!");
        return false;
      }

      // If not already favorited, create new favorite
      const favoriteLake = new FavoriteLake();
      favoriteLake.set("user", user);
      favoriteLake.set("lake", lakePointer);

      // Set ACL permissions
      const acl = new Parse.ACL(user);
      acl.setReadAccess(user, true);
      acl.setWriteAccess(user, true);
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      favoriteLake.setACL(acl);

      await favoriteLake.save();
      message.success("Lake added to favorites!");
      return true;
    } catch (error) {
      console.error("Error saving favorite:", error);
      message.error("Failed to add favorite. Please try again.");
      return false;
    }
  };

  const handleAdd = async () => {
    if (!lakeId) {
      message.error("Lake ID is not available.");
      return;
    }
    setIsAddingFavorite(true);
    try {
      await handleAddFavorite(lakeId);
    } finally {
      setIsAddingFavorite(false);
    }
  };

  return (
    <>
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
              {currentLakeMeta.name}
            </Title>
            <Row>
              <Col
                style={{
                  alignSelf: "center",
                  paddingLeft: "1rem",
                }}
              >
                {" "}
                <svg width="12" height="12">
                  <circle
                    cx="6"
                    cy="6"
                    r="6"
                    fill={getWQIColor(
                      wqiValues.value,
                      wqiValues.minVal,
                      wqiValues.maxVal
                    )}
                  />
                </svg>
                <Text
                  strong
                  style={{
                    lineHeight: 0,
                    fontSize: "15px",
                    marginLeft: "5px",
                  }}
                >
                  {currentLakeMeta.name}
                </Text>
              </Col>
            </Row>

            {/* ########################################################### */}
            <CustomCarousel
              maps={mapItems}
              bbox={bbox}
              updateBbox={updateBbox}
            />

            <div style={{ marginTop: "6%", paddingLeft: "1rem" }}>
              <PropertyRow label={t("Name")} value={currentLakeMeta.name} />
              <PropertyRow
                label={t("Fläche")}
                value={currentLakeMeta.area + " m²"}
              />
              <PropertyRow
                label={t("Badenutzung")}
                value={currentLakeMeta.swimmingUsage ? "Ja" : "Nein"}
              />
              <PropertyRow
                label={t("Bezirk")}
                value={currentLakeMeta.district}
              />
              <PropertyRow
                label={t("Umfang")}
                value={currentLakeMeta.circumference + " m"}
              />
              <PropertyRow
                label={t("Volumen")}
                value={currentLakeMeta.volume + " m³"}
              />
              <PropertyRow
                label={t("Durchnittliche Tiefe")}
                value={currentLakeMeta.averageDepth + " m"}
              />
              <PropertyRow
                label={t("Maximale Tiefe")}
                value={currentLakeMeta.maximumDepth + " m"}
              />
            </div>

            <Button
              onClick={handleAdd}
              loading={isAddingFavorite}
              style={{ marginLeft: "1rem" }}
              icon={<StarFilled />}
            >
              Als Favorit hinzufügen
            </Button>
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
            {/* Water Quality Index Container */}
            <div
              style={{
                width: "100%",
                borderRadius: "20px",
                backgroundColor: "white",
                marginBottom: "1%",
                padding: "1% 2%",
              }}
            >
              {/* Parent headline for Water Quality Index */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <Typography.Title
                  level={4}
                  style={{
                    fontWeight: "bold",
                    margin: 0,
                    marginRight: "0.5rem",
                  }}
                >
                  Water Quality Index (NDTrI)
                </Typography.Title>{" "}
                <InfoCircleOutlined
                  style={{
                    fontSize: "18px",
                    color: "#42A456",
                    cursor: "pointer",
                  }}
                  onClick={() => setIsInfoModalVisible(true)}
                />
              </div>

              {/* Two columns for State and Trend */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  width: "100%",
                  gap: "2%",
                }}
              >
                {/* Earth Observation Trophic State */}
                <div
                  style={{
                    width: "48%",
                    border: "2px solid #96F5D0",
                    borderRadius: "16px",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem 1rem 2.5rem 1rem",
                    }}
                  >
                    <Typography.Title
                      level={5}
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        margin: 0,
                      }}
                    >
                      Earth Observation Trophic State
                    </Typography.Title>
                    <div
                      style={{
                        marginTop: "1rem",
                      }}
                    >
                      {wqiValues.value !== 0 ? (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: "1rem",
                            }}
                          >
                            <span
                              style={{ fontSize: "16px", fontWeight: "bold" }}
                            >
                              NDTrI State: {wqiValues.value}
                            </span>
                          </div>
                          <MultiColorBar
                            minValue={wqiValues.minVal}
                            maxValue={wqiValues.maxVal}
                            value={wqiValues.value}
                          />
                        </>
                      ) : (
                        <p>Loading NDTrI data...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Earth Observation Trophic Trend */}
                <div
                  style={{
                    width: "48%",
                    border: "2px solid #96F5D0",
                    borderRadius: "16px",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "1rem 1rem 2.5rem 1rem",
                    }}
                  >
                    <Typography.Title
                      level={5}
                      style={{
                        fontWeight: "bold",
                        marginBottom: "1rem",
                        margin: 0,
                      }}
                    >
                      Earth Observation Trophic Trend
                    </Typography.Title>
                    <div
                      style={{
                        marginTop: "1rem",
                      }}
                    >
                      {wqiValues.value !== 0 ? (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: "1rem",
                            }}
                          >
                            <span
                              style={{ fontSize: "16px", fontWeight: "bold" }}
                            >
                              NDTrI Trend: {wqiValues.trend}
                            </span>
                          </div>
                          <MultiColorBar
                            minValue={wqiValues.minTrend}
                            maxValue={wqiValues.maxTrend}
                            value={wqiValues.trend}
                          />
                        </>
                      ) : (
                        <p>Loading NDTrI data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                borderRadius: "20px",
                marginBottom: "1%",
                backgroundColor: "white",
                padding: "1% 2%",
              }}
            >
              <WidgetStatic
                type="lakeStats-widget"
                config={config}
              ></WidgetStatic>
              <Collapse ghost items={items} />
            </div>

            <div
              style={{
                width: "100%",
                borderRadius: "20px",
                marginBottom: "1%",
                backgroundColor: "white",
                padding: "1% 2%",
              }}
            >
              <WidgetStatic
                type="lakePrediction-widget"
                config={config}
              ></WidgetStatic>
              <Collapse ghost items={items} />
            </div>

            <div
              style={{
                width: "100%",
                borderRadius: "20px",
                backgroundColor: "white",
                padding: "1% 2%",
              }}
            >
              <Typography.Title
                level={4}
                style={{
                  fontWeight: "bold",
                }}
              >
                Notizen zum {currentLakeMeta.name}
              </Typography.Title>
              <Notes lakeId={lakeId} currentUser={Parse.User.current()} />
            </div>
          </div>
        </Row>

        {/* Info Modal for NDTrI */}
        <Modal
          title="NDTrI - Normalized Difference Trophic Index"
          open={isInfoModalVisible}
          onCancel={() => setIsInfoModalVisible(false)}
          centered
          width={800}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setIsInfoModalVisible(false)}
            >
              OK
            </Button>,
          ]}
          styles={{
            header: {
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e8e8e8",
            },
          }}
        >
          <div
            style={{
              padding: "20px 0",
              lineHeight: "1.6",
              color: "#333",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  color: "#42A456",
                  fontSize: "18px",
                  marginBottom: "12px",
                }}
              >
                Wie wird der Index genau berechnet und welche Daten liegen ihm
                zugrunde?
              </h3>
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  marginBottom: "16px",
                }}
              >
                Der Wasserqualitätsindex (Normalized Difference Trophic Index:
                NDTrI) basiert auf den Bändern 2 (Wellenlänge 490 nm) für blaues
                Licht und 5 (Wellenlänge 705 nm) für den Übergangsbereich
                zwischen rotem Licht und nahem Infrarot der Sentinel-2 Mission
                und ist definiert als:
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontFamily: "serif",
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "6px",
                  textAlign: "center",
                  margin: "16px 0",
                  border: "1px solid #e9ecef",
                  letterSpacing: "1px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <span>
                    NDTrI<sub>image</sub> =
                  </span>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        borderBottom: "2px solid #333",
                        paddingBottom: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      B5 - B2
                    </div>
                    <div>B5 + B2</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "16px", lineHeight: "1.6" }}>
                Er wird zuerst pro Satellitenbild berechnet und anschließend
                über eine gesamte Saison von Anfang April bis Ende Oktober
                gemittelt. Es werden nur solche Pixel des Satellitenbildes
                verwendet werden, die 1) innerhalb des betrachten Sees liegen
                und 2) als Wasserpixel durch durch den Scene Classification
                (SCL) Algorithmus der Sentinel-2 Daten identifiziert werden. Im
                AD4GD GitHub Repository steht im Bereich{" "}
                <a
                  href="https://github.com/AD4GD/Component-openEO-harvester"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#42A456",
                    textDecoration: "underline",
                  }}
                >
                  Sentinal-2 Trophic State Estimation
                </a>{" "}
                ein Jupyter Notebook zur Verfügung, mit dem der
                Wasserqualitätsindex direkt auf der{" "}
                <a
                  href="https://openeo.cloud/about/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#42A456",
                    textDecoration: "underline",
                  }}
                >
                  openEO Plattform
                </a>{" "}
                berechnet und anschließend heruntergeladen werden kann.
              </div>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default LakeStats;
