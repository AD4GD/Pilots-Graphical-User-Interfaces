import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "header-bioconn-widget",
  meta: {},
  displayComponent: React.lazy(() => import("./header")),
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
    title: "Header Widget for BioConn",
    description: "Header widget used for BioConn",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Header Widget for BioConn",
      description: "Header widget used for BioConn",
      imageLink: require("./navbar.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
