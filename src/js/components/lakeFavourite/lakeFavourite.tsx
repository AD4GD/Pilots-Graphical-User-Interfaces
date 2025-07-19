import {
  Button,
  Col,
  Row,
  Spin,
  Typography,
  Empty,
  ConfigProvider,
  message,
} from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import React, { useEffect, useState } from "react";
import Parse from "parse";
import CustomCarousel from "../carousel/carousel";
import { useNavigate } from "@opendash/router";
import { useLakeMetaData } from "../../hooks/useLakeMetaData";

const { Title, Text } = Typography;

type Sensor = [string, string, number];

interface LakeItem {
  id: string;
  lakeId: string;
  name: string;
  sensors: Sensor[];
  description: string;
  bbox: string;
  mapItems?: MapItem[];
}

interface MapItem {
  layerUrls: string[];
  title: string;
  legend?: string;
}

const LakeFavourite: React.FC = ({}) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<LakeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sensors, setSensors] = useState<any[]>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchMapItems = async (bbox: string): Promise<MapItem[]> => {
    try {
      // Query for layer information from AD4GD_LakeLayers
      const layerQuery = new Parse.Query("AD4GD_LakeLayers");
      const layerResults = await layerQuery.find();

      // Transform the results into the format expected by CustomCarousel
      return layerResults.map((layer) => {
        const baseUrl = layer.get("layersUrl");
        const layersArray = layer.get("layersArray");
        const title = layer.get("layersTitle");
        const legend = layer.get("layersLegend");

        // Construct URLs for each layer number
        const layerUrls = layersArray.map((layerNum: string) => {
          // Handle URL with or without existing parameters
          return `${baseUrl}&layers=${layerNum}&bbox=${bbox}`;
        });

        return {
          layerUrls,
          title,
          legend: legend instanceof Parse.File ? legend.url() : legend,
        };
      });
    } catch (error) {
      console.error("Error fetching map layers:", error);
      return [];
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const user = Parse.User.current();
      if (!user) {
        console.error("No user logged in");
        setLoading(false);
        return;
      }

      const query = new Parse.Query("AD4GD_FavouriteLake");
      query.equalTo("user", user);
      query.include("lake");

      const results = await query.find();

      const favLakes = await Promise.all(
        results.map(async (fav) => {
          const lake = fav.get("lake");
          const bbox = lake?.get("bbox") || "Unknown";
          const sensors = await getSensorsForLake(lake.id);

          return {
            id: fav.id,
            lakeId: lake.id,
            name: lake?.get("label") || "Unknown",
            sensors,
            bbox,
            description: lake?.get("description") || "No description",
            mapItems: await fetchMapItems(bbox),
          };
        })
      );

      setFavorites(favLakes);
      await fetchSensorsForFavorites(favLakes);
    } catch (error) {
      message.error("Fehler beim Laden der Favoriten");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favlakeId: string) => {
    const user = Parse.User.current();
    if (!user) {
      message.error("Sie müssen angemeldet sein, um Favoriten zu entfernen!");
      return;
    }

    try {
      const FavoriteLake = Parse.Object.extend("AD4GD_FavouriteLake");
      const query = new Parse.Query(FavoriteLake);
      const lakeToRemove = await query.get(favlakeId);

      if (!lakeToRemove) {
        message.error(
          "Favorit nicht gefunden oder nicht im Besitz des Benutzers"
        );
        return;
      }

      const lakeName =
        favorites.find((fav) => fav.id === favlakeId)?.name || "the lake";

      await lakeToRemove.destroy();
      setFavorites((prev) => prev.filter((fav) => fav.id !== favlakeId));

      message.success(`${lakeName} wurde aus Ihren Favoriten entfernt`);
    } catch (error) {
      console.error("Error removing favorite:", error);
      message.error(
        "Fehler beim Entfernen des Favoriten. Bitte versuchen Sie es erneut."
      );
    }
  };

  const getLakeFromFavorite = async (favLakeId: string) => {
    try {
      const FavoriteLake = Parse.Object.extend("AD4GD_FavouriteLake");
      const query = new Parse.Query(FavoriteLake);
      query.include("lake");

      const favorite = await query.get(favLakeId);
      if (!favorite) {
        throw new Error("Favorite not found");
      }

      const lakePointer = favorite.get("lake");
      if (!lakePointer) {
        throw new Error("Associated lake not found");
      }

      return {
        lakePointer,
        lakeId: lakePointer.id,
      };
    } catch (error) {
      console.error("Error getting lake from favorite:", error);
      throw error;
    }
  };

  const getSensorsForLake = async (lakeId: string): Promise<Sensor[]> => {
    try {
      const Lake = Parse.Object.extend("MIAAS_Geographies");
      const query = new Parse.Query(Lake);
      const lake = await query.get(lakeId);

      if (!lake) {
        throw new Error("Lake not found");
      }

      const sensorsData = lake.get("sensors");

      // Validate the array format
      if (!Array.isArray(sensorsData)) {
        return [];
      }

      return sensorsData.filter(
        (sensor) =>
          Array.isArray(sensor) &&
          sensor.length === 3 &&
          typeof sensor[0] === "string" &&
          typeof sensor[1] === "string" &&
          typeof sensor[2] === "number"
      );
    } catch (error) {
      console.error("Error getting sensors for lake:", error);
      throw error;
    }
  };

  const getSensorsFromFavoriteId = async (favLakeId: string) => {
    try {
      const { lakePointer, lakeId } = await getLakeFromFavorite(favLakeId);
      const sensors = await getSensorsForLake(lakeId);

      return {
        lake: lakePointer,
        sensors,
      };
    } catch (error) {
      console.error("Error in getSensorsFromFavoriteId:", error);
      throw error;
    }
  };

  const fetchSensorsForFavorites = async (favLakes: LakeItem[]) => {
    setLoadingSensors(true);
    try {
      const allSensors = [];

      for (const favLake of favLakes) {
        try {
          const { sensors: lakeSensors } = await getSensorsFromFavoriteId(
            favLake.id
          );
          allSensors.push(...lakeSensors);
        } catch (error) {
          console.error(
            `Error fetching sensors for favorite ${favLake.id}:`,
            error
          );
        }
      }

      setSensors(allSensors);
      return allSensors;
    } catch (error) {
      console.error("Error fetching sensors:", error);
      return [];
    } finally {
      setLoadingSensors(false);
    }
  };

  const navigateToLakeDetail = (favLake: LakeItem) => {
    navigate(`/splashboard/lake/${favLake.lakeId}`, {
      state: {
        item: {
          id: favLake.lakeId,
          name: favLake.name,
          sensors: favLake.sensors,
        },
      },
    });
  };

  const { result: properties } = useLakeMetaData();

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
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
          />
        </Row>

        <Row style={{ width: "100%", marginTop: "16px" }}>
          <Col span={8} style={{ paddingRight: "16px" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                height: "100%",
              }}
            >
              <Title
                level={2}
                style={{ marginBottom: "16px", fontSize: "24px" }}
              >
                Favoriten
              </Title>
            </div>
          </Col>

          <Col span={16}>
            {loading ? (
              <Spin
                size="large"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "40px 0",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              />
            ) : favorites.length === 0 ? (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "40px",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <Empty
                  description={
                    <>
                      <Title level={3} style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                        No favorite lakes added
                      </Title>
                      <Text type="secondary">
                        Add lakes to your favorites to see them here
                      </Text>
                    </>
                  }
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {favorites.map((favLake) => {
                  const lakeMetadata = properties.find(
                    (item) => item.geography?.id === favLake.lakeId
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

                  return (
                    <div
                      key={favLake.id}
                      style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "20px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Title
                          level={2}
                          style={{ marginBottom: "8px", fontSize: "22px" }}
                        >
                          {lakeMetadata.name || favLake.name}
                        </Title>
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => handleRemoveFavorite(favLake.id)}
                        >
                          Entfernen
                        </Button>
                      </div>

                      <Row gutter={16} style={{ marginBottom: "16px" }}>
                        <Col span={12}>
                          <div
                            style={{
                              paddingLeft: "5rem",
                              marginTop: "5rem",
                            }}
                          >
                            {/* Using CSS Grid for perfect alignment */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "max-content 1fr",
                                gap: "12px",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Name:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.name || favLake.name}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Fläche:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.area
                                  ? `${lakeMetadata.area.toLocaleString()} m²`
                                  : "0 m²"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Badenutzung:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.swimmingUsage ? "Yes" : "No"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Bezirk:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.district || "N/A"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Umfang:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.circumference
                                  ? `${lakeMetadata.circumference} m`
                                  : "0 m"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Volumen:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.volume
                                  ? `${lakeMetadata.volume} m³`
                                  : "0 m³"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Durchschnittliche Tiefe:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.averageDepth
                                  ? `${lakeMetadata.averageDepth} m`
                                  : "0 m"}
                              </Text>

                              <Text
                                strong
                                style={{ fontSize: "16px", textAlign: "left" }}
                              >
                                Maximale Tiefe:
                              </Text>
                              <Text style={{ fontSize: "16px" }}>
                                {lakeMetadata.maximumDepth
                                  ? `${lakeMetadata.maximumDepth} m`
                                  : "0 m"}
                              </Text>
                            </div>

                            <Text
                              style={{
                                color: "#1890ff",
                                cursor: "pointer",
                                fontSize: "16px",
                                textDecoration: "underline",
                                display: "inline-block",
                                marginTop: "1rem",
                              }}
                              onClick={() => navigateToLakeDetail(favLake)}
                            >
                              Detailseite zu diesem See anzeigen
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          {favLake.mapItems && (
                            <div
                              style={{
                                height: "200px",
                                border: "1px solid #f0f0f0",
                                borderRadius: "4px",
                              }}
                            >
                              <CustomCarousel
                                maps={favLake.mapItems}
                                bbox={favLake.bbox}
                                updateBbox={() => {}}
                              />
                            </div>
                          )}
                        </Col>
                      </Row>

                      <div
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: "4px",
                          padding: "12px",
                          marginTop: "2rem",
                        }}
                      >
                        {loadingSensors ? (
                          <Spin tip="Loading sensors data..." />
                        ) : (
                          <WidgetStatic
                            type="lakeStats-widget"
                            config={{
                              _sources: [],
                              _items: [],
                              _dimensions: [...favLake.sensors],
                              _history: {},
                            }}
                            style={{ width: "100%" }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Col>
        </Row>
      </ConfigProvider>
    </div>
  );
};

export default LakeFavourite;
