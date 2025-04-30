import { createWidget } from "@opendash/plugin-monitoring";
import React from "react";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "header-widget",
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
    title: "Header Widget",
    description: "Header widget used for logo and navigation bar",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "Header Widget",
      description: "Header widget used for logo and navigation bar",
      imageLink: require("./navbar.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
