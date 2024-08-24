import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Col, Row, Typography } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";
import React, { useEffect, useMemo, useState } from "react";

import { SingleSelectDropdown, CustomDropdown } from "..//dropdown";
import { CustomButton } from "../button";
import { CustomChart } from "..//chart";
import { useLocation, useParams } from "@opendash/router";

const LakeStats: React.FC = ({}) => {
  // const lakeId = useParams();
  // console.log("lake id: ", lakeId);

  const location = useLocation();
  const {
    item: { sensors },
  } = location.state || {};

  console.log("test:", sensors);

  useEffect(() => {
    // fetchData(items);
  }, []);

  const t = useTranslation();

  const { Title, Link } = Typography;

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [data, setData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>("");

  //   context["setLoading"](false);
  const DataService = useDataService();
  const timeFilter = [
    { key: "day", label: "Daily" }, // Day
    { key: "month", label: "Monthly" }, // Month
    { key: "week", label: "Weekly" }, // Week
    { key: "year", label: "Yearly" }, // Year
  ];
  // const items = [
  //   [
  //     {
  //       id: "sensor_ploetzensee_waterlevel",
  //       name: "Plötzensee Water Level",
  //       source: "ad4gd_lakes",
  //       valueTypes: [
  //         {
  //           type: "Number",
  //           name: "Water Level",
  //           unit: "cm",
  //         },
  //       ],
  //       meta: {
  //         visible: true,
  //         referenceChange: false,
  //         onChange: false,
  //         source_source: "ad4gd_lakes",
  //         id_source: "sensor_ploetzensee_waterlevel",
  //         active: true,
  //         persist: true,
  //         BaseDataRevision: false,
  //         configuration_id: "66c33b8e183386126fe055c3",
  //         vTypeHash: "mNumber",
  //       },
  //     },
  //     0,
  //   ],
  //   [
  //     {
  //       id: "sensor_ploetzensee_watertemperature",
  //       name: "Plötzensee Water Temperature",
  //       source: "ad4gd_lakes",
  //       valueTypes: [
  //         {
  //           type: "Number",
  //           name: "Water Temperature",
  //           unit: "°C",
  //         },
  //       ],
  //       meta: {
  //         referenceChange: false,
  //         persist: true,
  //         BaseDataRevision: false,
  //         vTypeHash: "°CNumber",
  //       },
  //     },
  //     0,
  //   ],
  // ];

  //Here you get the Values from the Settings!
  //   const items = context.useItemDimensionConfig();
  //   console.log("items", items);

  // const fetchProperties = (items: any[]) => {
  //   return items.map((item: any[]) => {
  //     const { valueTypes } = item[0];
  //     const key = valueTypes[0].name;
  //     const label = valueTypes[0].name;

  //     return {
  //       key,
  //       label,
  //     };
  //   });
  // };

  // const properties = fetchProperties(items);

  // const transformData = (data: any[]) => {
  //   return data.map((item: any[]) => {
  //     const { id, name: lake, valueTypes } = item[0];
  //     const propertyName = valueTypes[0].name;
  //     const unit = valueTypes[0].unit;
  //     const data = item[2];

  //     return {
  //       id,
  //       lake,
  //       propertyName,
  //       unit,
  //       data,
  //     };
  //   });
  // };

  // const fetchData = (items) => {
  //   DataService.fetchDimensionValuesMultiItem(items, {
  //     historyType: "relative",
  //     unit: "year",
  //     value: 2,
  //   }).then((result) => {
  //     //Array of Data Points
  //     // console.log("transformed data", result);
  //     const transformedData = transformData(result);
  //     setData(transformedData);
  //   });
  // };

  //If you want to get all Items without the Settings, you can use this!
  // console.log("result without settings", DataService._listOrThrowSync());

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

  const myConfig1 = useMemo(() => {
    const config = {
      _sources: [],
      _items: [],
      _dimensions: [
        ["ad4gd_lakes", "sensor_flughafensee_waterlevel", 0],
        ["ad4gd_lakes", "sensor_flughafensee_watertemperature", 0],
      ],
      _history: {},
    };

    return config;
  }, [sensors]);

  const myConfig2 = useMemo(() => {
    const config = {
      _sources: [],
      _items: [],
      _dimensions: sensors,
      _history: {},
    };

    return config;
  }, [sensors]);

  console.log("myConfig1: ", myConfig1);
  console.log("myConfig2: ", myConfig2);

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
            backgroundColor: "red",
          }}
        ></div>

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
          {/* <Title
            level={4}
            style={{
              fontWeight: "bold",
              paddingBottom: "2%",
            }}
          >
            Verfügbare Daten zu diesem See
          </Title> */}

          {/* Add gutter for spacing */}
          {/* <Row
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
              placeholder="Daily"
              selectedValue={selectedFilter}
              handleClick={selectFilter}
            />
          </Row> */}

          {/* <CustomChart
            data={data}
            properties={selectedProperties}
            filter={selectedFilter}
          /> */}

          <WidgetStatic
            type="lakeStats-widget"
            config={myConfig1}
          ></WidgetStatic>

          {/* <Row style={{ marginTop: "2%" }}>
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
                flex: 0.35,
                justifyContent: "space-between",
              }}
            >
              <CustomButton text="Download Graph" />

              <CustomButton text="Download Rohdaten" />
            </Row>
          </Row> */}
        </div>
        <div
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
        ></div>
      </Row>
    </>
  );
};

export default LakeStats;
