import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "lake-overview-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./lakeOverview")),
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
    title: "Lake overview Widget",
    description: "Lake overview widget used to navigate all lakes",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Lake overview Widget",
      description: "Lake overview widget used to navigate all lakes ",
      imageLink: require("./berlin-map.svg"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
