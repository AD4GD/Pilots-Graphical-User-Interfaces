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
import { Carousel } from "./components/carousel";
import { LakeOverview } from "./components/LakeOverviewPage";
import { Information } from "./components/InformationPage";
import { LakeStats } from "./components/lakeStats";
import { NotFound } from "./components/NotFoundPage";
import { testWMS } from "./components/testPage";
import { testFIS } from "./components/testFIS";

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

  factory.registerRoute({
    path: "/lake/:lakeId",
    componentSync: LakeStats,
    props: {},
  });

  factory.registerRoute({
    path: "/fcube",
    componentSync: testWMS,
    props: {},
  });

  factory.registerRoute({
    path: "/fis",
    componentSync: testFIS,
    props: {},
  });

  factory.registerRoute({
    path: "*",
    componentSync: NotFound,
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
  factory.ui.disableHeader();

  await factory.use(
    new ParsePlugin({
      authLdapActive: false,
    })
  );
  await factory.use(new TimeseriesPlugin());
  await factory.use(new MonitoringPlugin());
  await factory.use(new GeoPlugin());
  await factory.use(new GeoPluginMapLibre());
  await factory.use(
    new MobilityPlugin({
      menuGroupLabel: "ad4gd:menu.areasAndObject.label",
      menuGroupIcon: "fa:map",
      disableMenuItems: {
        mobilityadminproviders: true,
        mobilityadminzones: false,
        mobilityadmingbfs: true,
        mobilityadminpricing: true,
      },
    })
  );
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
    id: "ad4gd/home",
    group: "ad4gd",
    place: "frontpage",
    order: 0,
    label: "ad4gd:home.label",
    icon: "fa:water",
    color: "#4385c2",
    link: "/home",
    routeCondition: "**",
    activeCondition: "/",
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
  factory.registerStaticNavigationItem({
    id: "admin/ad4gd/lakeImages",
    group: "admin/ad4gd",
    place: "sidebar",
    order: 100,
    label: "ad4gd:classes.AD4GD_LakeImages.label_plural",
    icon: "fa:image",
    color: "#676767",
    link: "/admin/parse/AD4GD_LakeImages",
    routeCondition: "**",
    activeCondition: "/",
    permission: "parse-admin",
  });

  $parse.ui.setClassConfig({
    className: "AD4GD_LakeMetaData",
    createFields: [
      "name",
      "area",
      "swimmingUsage",
      "district",
      "circumference",
    ],
    editFields: ["name", "area", "swimmingUsage", "district", "circumference"],
    displayFields: [
      "name",
      "area",
      "swimmingUsage",
      "district",
      "circumference",
    ],
    titleFields: ["name"],
    // Tranlation for fields in /src/translations/[language].json
    translationPrefix: "ad4gd:classes.",
  });
  $parse.ui.setDefaultView("AD4GD_LakeMetaData", { type: "table" });
  $parse.ui.setClassConfig({
    className: "AD4GD_LakeImages",
    createFields: ["lake", "image", "description"],
    editFields: ["lake", "image", "description"],
    displayFields: ["lake", "image", "description"],
    titleFields: ["lake"],
    // Tranlation for fields in /src/translations/[language].json
    translationPrefix: "ad4gd:classes.",
  });

  $parse.ui.setDefaultView("AD4GD_LakeImages", { type: "table" });
  //.------------------- Example Admin Interface Config-------------------

  $monitoring.registerWidget(ExampleWidget);
  $monitoring.registerWidget(HeaderWidget);
  $monitoring.registerWidget(LakeDetails);
  $monitoring.registerWidget(LakeStatss);
  $monitoring.registerWidget(lakeOverviewWidget);
}).then((app) => {
  console.log("init open.DASH");
});
