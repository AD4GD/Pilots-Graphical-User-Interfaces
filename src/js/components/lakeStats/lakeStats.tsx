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
  const location = useLocation();
  const {
    item: { sensors },
  } = location.state || {};

  console.log("test:", ...sensors);

  const t = useTranslation();

  const config = useMemo(() => {
    return {
      _sources: [],
      _items: [],
      _dimensions: [...sensors],
      _history: {},
    };
  }, [sensors]);

  console.log("config: ", config);

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
          <WidgetStatic type="lakeStats-widget" config={config}></WidgetStatic>
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
