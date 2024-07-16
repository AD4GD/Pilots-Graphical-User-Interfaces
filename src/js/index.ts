import "antd/dist/reset.css";

import "./parse.config";
import "./highcharts.config";

import { init, StorageAdapterLS } from "@opendash/core";
import { registerIconPack } from "@opendash/icons";
import { HighchartsPlugin } from "@opendash/plugin-highcharts";
import { GeoPlugin } from "@opendash/plugin-geo";
import { GeoPluginMapLibre } from "@opendash/plugin-geo-maplibre";
import { $monitoring, MonitoringPlugin } from "@opendash/plugin-monitoring";
import { OpenwarePlugin } from "@opendash/plugin-openware";
import { ParsePlugin } from "@opendash/plugin-parse";
import { ParseMonitoringPlugin } from "@opendash/plugin-parse-monitoring";
import { MobilityPlugin } from "@opendash/plugin-mobility";
import { TimeseriesPlugin } from "@opendash/plugin-timeseries";
import ExampleWidget from "./widgets/example";
import MapWidget from "./widgets/map";
import HeaderWidget from "./widgets/header";
import lakeOverviewWidget from "./widgets/lakeOverview";

init("opendash", async (factory) => {
  // Icons
  // @ts-ignore
  registerIconPack(await import("@opendash/icons/dist/fa-regular.json"));

  // Translations:

  factory.registerLanguage("en", "English");
  factory.registerLanguage("de", "Deutsch", "en", true);
  // ant design translations

  factory.registerAntDesignTranslation(
    "en",
    () => import("antd/lib/locale/en_US")
  );

  factory.registerAntDesignTranslation(
    "de",
    () => import("antd/lib/locale/de_DE")
  );

  // widget translations

  factory.registerTranslationResolver(
    "en",
    "app",
    async () => await import("./translations/app/en.json")
  );

  // Adapter + Plugins

  factory.registerDeviceStorageAdapter(new StorageAdapterLS());

  await factory.use(
    new ParsePlugin({
      authLdapActive: false,
    })
  );
  await factory.use(new TimeseriesPlugin());
  await factory.use(new MonitoringPlugin());
  await factory.use(new GeoPlugin());
  await factory.use(new GeoPluginMapLibre());
  await factory.use(new MobilityPlugin());
  await factory.use(
    new OpenwarePlugin({
      host: "data.digitalzentrum-lr.de",
      secure: true,
    })
  );
  await factory.use(
    new ParseMonitoringPlugin({
      liveQueries: false,
    })
  );
  await factory.use(new HighchartsPlugin());

  factory.registerStaticNavigationItem({
    id: "monitoring/dashboard",
    group: "monitoring",
    place: "frontpage",
    order: 1,
    label: "opendash:monitoring.label",
    icon: "fa:chart-line",
    color: "#4385c2",
    link: "/monitoring/dashboards",
    routeCondition: "**",
    activeCondition: "/",
  });
  factory.registerStaticNavigationItem({
    id: "admin/parse/item",
    group: "admin/parse",
    place: "frontpage",
    order: 100,
    label: "opendash:admin.label",
    icon: "fa:cogs",
    color: "#676767",
    link: "/admin/parse/_Role",
    routeCondition: "**",
    activeCondition: "/",
    permission: "parse-admin",
  });

  $monitoring.registerWidget(ExampleWidget);
  $monitoring.registerWidget(MapWidget);
  $monitoring.registerWidget(HeaderWidget);
  $monitoring.registerWidget(lakeOverviewWidget);
}).then((app) => {
  console.log("init open.DASH");
});
