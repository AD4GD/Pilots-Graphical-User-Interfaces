import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "lake-map-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./lakeMap")),
  settingsComponent: React.lazy(() => import("./settings")),

  dataItems: {
    select: "dimension",
    min: 1,
    max: 1,
    types: ["Number", "Boolean", "String"],
  },

  dataFetching: {
    live: true,
    history: true,
    historyRequired: true,
  },

  dataExplorer: {
    title: "Lake Map Widget",
    description: "Lake map widget used to navigate all lakes",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Lake map Widget",
      description: "Lake map widget used to navigate all lakes ",
      imageLink: require("./berlin-map.svg"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
