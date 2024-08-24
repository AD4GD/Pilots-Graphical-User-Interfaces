import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Row, Typography } from "antd";
import { useDataService } from "@opendash/plugin-timeseries";
import React, { useState } from "react";

import {
  SingleSelectDropdown,
  CustomDropdown,
} from "../../components/dropdown";
import { CustomButton } from "../../components/button";
import { CustomChart } from "../../components/chart";
import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    context["setLoading"](false);
    const DataService = useDataService();

    // console.log("dataservice", DataService);
    //Here you get the Values from the Settings!
    const items = context.useItemDimensionConfig();
    // console.log("items", items);
    const [data, setData] = useState([]);

    const fetchProperties = (items: any[]) => {
      return items.map((item: any[]) => {
        const { valueTypes } = item[0];
        const key = valueTypes[0].name;
        const label = valueTypes[0].name;

        return {
          key,
          label,
        };
      });
    };

    const properties = fetchProperties(items);

    const transformData = (data: any[]) => {
      return data.map((item: any[]) => {
        const { id, name: lake, valueTypes } = item[0];
        const propertyName = valueTypes[0].name;
        const unit = valueTypes[0].unit;
        const data = item[2];

        return {
          id,
          lake,
          propertyName,
          unit,
          data,
        };
      });
    };

    DataService.fetchDimensionValuesMultiItem(items, {
      historyType: "relative",
      unit: "year",
      value: 2,
    }).then((result) => {
      //Array of Data Points
      // console.log("transformed data", result);
      const transformedData = transformData(result);
      setData(transformedData);
    });

    //If you want to get all Items without the Settings, you can use this!
    // console.log("result without settings", DataService._listOrThrowSync());

    const { Title, Link } = Typography;
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

    const timeFilter = [
      { key: "day", label: "Daily" }, // Day
      { key: "month", label: "Monthly" }, // Month
      { key: "week", label: "Weekly" }, // Week
      { key: "year", label: "Yearly" }, // Year
    ];

    const [selectedFilter, setSelectedFilter] = useState<string | null>("");

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

    return (
      <div style={{ flex: 0.7, margin: "5%" }}>
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

        <CustomChart
          data={data}
          properties={selectedProperties}
          filter={selectedFilter}
        />

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
              flex: 0.33,
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
