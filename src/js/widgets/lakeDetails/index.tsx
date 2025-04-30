import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "lakeDetails-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./lakeDetails")),
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
    title: "Lake Details Widget",
    description: "This widget shows general details about lake.",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Lake Details Widget",
      description: "This widget shows general details about lake.",
      imageLink: require("./map.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
