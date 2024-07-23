import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Col, Row, Typography } from "antd";
import { useDataService } from "@opendash/plugin-timeseries";
import React, { useState } from "react";

import {
  SingleSelectDropdown,
  CustomDropdown,
} from "../../components/dropdown";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import { ConfigInterface } from "./types";
import { Flex } from "antd/es";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context["setLoading"](false);
    const DataService = useDataService();

    console.log("Data Services", DataService);

    const { Title, Text, Link } = Typography;
    const [selectedProperties, setSelectedProperties] = useState<string[]>([
      "Wasserstand",
    ]);

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    const selectProperties = (e: any) => {
      const value = e.key;
      setSelectedProperties((prevValues) =>
        prevValues.includes(value)
          ? prevValues.filter((v) => v !== value)
          : [...prevValues, value]
      );
    };

    const selectFilter = (key: string) => {
      setSelectedFilter(key);
    };

    const timeFilter = [
      { key: "day", label: "Tag" }, // Day
      { key: "month", label: "Monat" }, // Month
      { key: "week", label: "Woche" }, // Week
      { key: "year", label: "Jahr" }, // Year
      { key: "all", label: "Alles" }, // All
    ];

    const properties = [
      {
        key: "Wasserstand",
        label: "Wasserstand",
      },
      {
        key: "Temperatur",
        label: "Temperatur",
      },
      {
        key: "Luftfeuchtigkeit",
        label: "Luftfeuchtigkeit",
      },
    ];

    const data = [
      {
        timestamp: 1634059200000,
        Wasserstand: 75,
        Temperatur: 20,
        Luftfeuchtigkeit: 40,
      },
      {
        timestamp: 1634145600000,
        Wasserstand: 60,
        Temperatur: 25,
        Luftfeuchtigkeit: 45,
      },
      {
        timestamp: 1634232000000,
        Wasserstand: 80,
        Temperatur: 22,
        Luftfeuchtigkeit: 50,
      },
      {
        timestamp: 1634318400000,
        Wasserstand: 70,
        Temperatur: 23,
        Luftfeuchtigkeit: 55,
      },
      {
        timestamp: 1634404800000,
        Wasserstand: 85,
        Temperatur: 21,
        Luftfeuchtigkeit: 60,
      },
      {
        timestamp: 1634491200000,
        Wasserstand: 65,
        Temperatur: 24,
        Luftfeuchtigkeit: 55,
      },
      {
        timestamp: 1634577600000,
        Wasserstand: 90,
        Temperatur: 26,
        Luftfeuchtigkeit: 65,
      },
      {
        timestamp: 1634664000000,
        Wasserstand: 55,
        Temperatur: 28,
        Luftfeuchtigkeit: 70,
      },
      {
        timestamp: 1634750400000,
        Wasserstand: 95,
        Temperatur: 27,
        Luftfeuchtigkeit: 75,
      },
      {
        timestamp: 1634836800000,
        Wasserstand: 50,
        Temperatur: 30,
        Luftfeuchtigkeit: 80,
      },
    ];

    return (
      <div style={{ flex: 0.7, padding: "2%" }}>
        <Title
          level={4}
          style={{
            fontWeight: "bold",
            paddingBottom: "2%",
            // backgroundColor: window?.document?.documentElement?.style.cssText
            //   .split(";")[0]
            //   .split(": ")[1],
          }}
        >
          Verfügbare Daten zu diesem See
        </Title>

        {/* Add gutter for spacing */}
        <Row
          gutter={[16, 16]}
          style={{ marginTop: "2%", justifyContent: "space-evenly" }}
        >
          <CustomDropdown
            items={properties}
            selectedValues={selectedProperties}
            handleClick={selectProperties}
          />

          <SingleSelectDropdown
            items={timeFilter}
            placeholder="Wähle weitere Daten"
            selectedValue={selectedFilter}
            handleClick={selectFilter}
          />
        </Row>

        <CustomChart data={data} properties={selectedProperties} />

        <Row gutter={[16, 16]} style={{ marginTop: "2%", padding: "2%" }}>
          <Link
            style={{
              color: "#42A456",
              fontSize: "16px",
              display: "flex",
              flex: 0.65,
              alignItems: "center",
              justifyContent: "space-between",
            }}
            href="https://ant.design"
            target="_blank"
            underline
          >
            Wie wurden die dargestellten Daten erhoben?
          </Link>
          <Row
            style={{
              flex: 0.4,
              justifyContent: "space-between",
            }}
          >
            <CustomButton text="Download Graph" />

            <CustomButton text="Download Rohdaten" />
          </Row>
        </Row>
      </div>
    );
  }
);
