import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "lakeStats-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./lakeStats")),
  settingsComponent: React.lazy(() => import("./settings")),

  dataItems: {
    select: "dimension",
    min: 1,
    max: 10,
    types: ["Number", "Boolean", "String"],
  },

  dataExplorer: {
    title: "Lake Statistics Widget",
    description: "This is lake stats widget",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Lake Statistics Widget",
      description: "This is lake stats widget",
      imageLink: require("./graph.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
