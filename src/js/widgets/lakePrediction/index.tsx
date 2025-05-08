import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "lakePrediction-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./lakePrediction")),
  settingsComponent: React.lazy(() => import("./settings")),

  dataItems: {
    select: "dimension",
    min: 1,
    max: 10,
    types: ["Number", "Boolean", "String"],
  },

  dataExplorer: {
    title: "Lake Prediction Widget",
    description: "This widget shows predictions for lakes.",
    icon: "fa:chart-line",
    config: {},
  },

  presets: [
    {
      label: "Lake Prediction Widget",
      description: "This widget shows predictions for lakes.",
      imageLink: require("./graph.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
