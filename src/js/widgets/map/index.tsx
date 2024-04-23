import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "map-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./map")),
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
    title: "Map Widget",
    description: "This is map widget",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Map Widget",
      description: "This is map widget",
      imageLink: require("./map.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
