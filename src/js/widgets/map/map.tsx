import React from "react";
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";

import { ConfigInterface } from "./types";

const styles = {
  container: {
    padding: "5%",
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
  },
  dot: {
    marginRight: "5px",
  },
  text: {
    fontSize: "12px",
  },
  image: {
    maxWidth: "100%",
    display: "block",
    marginBottom: "5%",
    marginTop: "5%",
  },
  imageDescription: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  propertyContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: "5%",
  },
  propertyRow: {
    display: "flex",
    // justifyContent: "space-between",
  },

  propertyText: {
    fontSize: "12px",
    flex: 0.3,
    fontWeight: "500",
  },
};

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context.setLoading(false);
    const DataService = useDataService();

    console.log("DataService", DataService);

    const properties = {
      name: "Plötzensee",
      area: "76800 m2",
      swimmingUsage: "Ja",
      district: "Mitte",
      circumference: "1645,102 m",
    };

    return (
      <div style={styles.container}>
        <h1 style={styles.title}>{properties.name}</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="10" height="10" style={styles.dot}>
            <circle cx="5" cy="5" r="5" fill="#55b169" />
          </svg>
          <text style={styles.text}>
            {properties.name} I ggf. Zusatzinfos wie Zahl?
          </text>
        </div>
        <img src={require("./map.png")} alt="Map" style={styles.image} />
        <text style={styles.imageDescription}>
          Bildbeschreibung zum obenstehenden Bild
        </text>
        <div style={styles.propertyContainer}>
          <div style={styles.propertyRow}>
            <text style={styles.propertyText}>{t("Name")}: </text>
            <text style={styles.propertyText}>{properties.name}</text>
          </div>
          <div style={styles.propertyRow}>
            <text style={styles.propertyText}>{t("Fläche")}: </text>
            <text style={styles.propertyText}>{properties.area}</text>
          </div>
          <div style={styles.propertyRow}>
            <text style={styles.propertyText}>{t("Badenutzung")}: </text>
            <text style={styles.propertyText}>{properties.swimmingUsage}</text>
          </div>
          <div style={styles.propertyRow}>
            <text style={styles.propertyText}>{t("Bezirk")}: </text>
            <text style={styles.propertyText}>{properties.district}</text>
          </div>
          <div style={styles.propertyRow}>
            <text style={styles.propertyText}>{t("Umfang")}: </text>
            <text style={styles.propertyText}>{properties.circumference}</text>
          </div>
        </div>
      </div>
    );
  }
);
