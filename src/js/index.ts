import "antd/dist/reset.css";

import "./parse.config";
import "./highcharts.config";
import "./leaflet.config";

import { init, StorageAdapterLS } from "@opendash/core";
import { registerIconPack } from "@opendash/icons";
import { HighchartsPlugin } from "@opendash/plugin-highcharts";
import { GeoPlugin } from "@opendash/plugin-geo";
import { GeoPluginMapLibre } from "@opendash/plugin-geo-maplibre";
import { $monitoring, MonitoringPlugin } from "@opendash/plugin-monitoring";
import { OpenwarePlugin } from "@opendash/plugin-openware";
import { $parse, ParsePlugin } from "@opendash/plugin-parse";
import { ParseMonitoringPlugin } from "@opendash/plugin-parse-monitoring";
import { MobilityPlugin } from "@opendash/plugin-mobility";
import { TimeseriesPlugin } from "@opendash/plugin-timeseries";
import ExampleWidget from "./widgets/example";
import HeaderWidget from "./widgets/header";
import LakeDetails from "./widgets/lakeDetails";
import LakeStatss from "./widgets/lakeStats";
import lakeOverviewWidget from "./widgets/lakeOverview";
import HomePage from "./widgets/lakeOverview";
import { Carousel } from "./components/carousel";
import { LakeOverview } from "./components/lakeOverviewPage";
import { Information } from "./components/InformationPage";
import { LakeStats } from "./components/lakeStats";

init("opendash", async (factory) => {
  // Icons
  // @ts-ignore
  registerIconPack(await import("@opendash/icons/dist/fa-regular.json"));

  // Translations:

  factory.registerLanguage("en", "English");
  factory.registerLanguage("de", "Deutsch", "en", true);
  // ant design translations

  // factory.registerRoute({
  //   path: "/",
  //   componentSync: HomePage,
  //   props: { images: [] },
  // });

  factory.registerRoute({
    path: "/home",
    componentSync: LakeOverview,
    props: {},
  });

  factory.registerRoute({
    path: "/info",
    componentSync: Information,
    props: {},
  });

  factory.registerRoute({
    path: "/lake",
    componentSync: LakeStats,
    props: {},
  });

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
    "ad4gd",
    async () => await import("./translations/en.json")
  );

  factory.registerTranslationResolver(
    "de",
    "ad4gd",
    async () => await import("./translations/de.json")
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
  //.------------------- Example Admin Interface Config-------------------

  factory.registerStaticNavigationGroup({
    id: "admin/ad4gd",
    order: 100,
    label: "AD4GD",
    icon: "fa:cogs",
  });
  factory.registerStaticNavigationItem({
    id: "admin/ad4gd/lakes",
    group: "admin/ad4gd",
    place: "sidebar",
    order: 100,
    label: "ad4gd:classes.AD4GD_LakeMetaData.label_plural",
    icon: "fa:water",
    color: "#676767",
    link: "/admin/parse/AD4GD_LakeMetaData",
    routeCondition: "**",
    activeCondition: "/",
    permission: "parse-admin",
  });

  $parse.ui.setClassConfig({
    className: "AD4GD_LakeMetaData",
    createFields: ["label", "description", "lakeId", "image"],
    editFields: ["label", "description", "lakeId", "image"],
    displayFields: ["label", "description", "lakeId", "image"],
    titleFields: ["label"],
    // Tranlation for fields in /src/translations/[language].json
    translationPrefix: "ad4gd:classes.",
  });

  $parse.ui.setDefaultView("AD4GD_LakeMetaData", { type: "table" });
  //.------------------- Example Admin Interface Config-------------------

  $monitoring.registerWidget(ExampleWidget);
  $monitoring.registerWidget(HeaderWidget);
  $monitoring.registerWidget(LakeDetails);
  $monitoring.registerWidget(LakeStatss);
  $monitoring.registerWidget(lakeOverviewWidget);
}).then((app) => {
  console.log("init open.DASH");
});
