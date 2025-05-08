import { createWidgetComponent } from "@opendash/plugin-monitoring";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ draft, updateDraft, ...context }) => {
    return null;
  }
);
