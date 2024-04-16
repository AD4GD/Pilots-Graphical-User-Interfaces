import { useTranslation } from "@opendash/core";

import { createWidgetComponent } from "@opendash/plugin-monitoring";

import { useDataService } from "@opendash/plugin-timeseries";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    const DataService = useDataService();

    context.setLoading(false);
    context.setName(t("app:widgets.example.title"));

    const { height, width } = context.useContainerSize();
    const history = context.useFetchDimensionValues();

    const [value, setValue] = React.useState(0);

    React.useEffect(() => {
      let summe = 0;
      for (const [config, dimension, data] of history) {
        console.log("Dimension", config.name, dimension, data);

        for (const { date, value } of data) {
          console.log(new Date(date), value);

          summe += value;
        }
      }

      setValue(value);
    }, [history]);

    return <div>{value}</div>;
  }
);
