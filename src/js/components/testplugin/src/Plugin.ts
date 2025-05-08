import { AppFactory, AppPluginInterface } from "@opendash/core";
import { TestComponent } from "./components/TestComponent";

export interface Options {
    testOption: string;
  }

export class TestPlugin implements AppPluginInterface {
    name: string = "TestPlugin";

    private options: Partial<Options> = {};

  constructor(options?: Partial<Options>) {
    this.options = options || {};
  }

    async onFactory(factory: AppFactory) {
        factory.registerRoute({
          path: "/test/start",
          props: this.options,
          component: async () => ({ default: TestComponent }),
          //permission: "",
        });
    
        // Navigation:
        factory.registerStaticNavigationItem({
          id: "test/start",
          place: "frontpage",
          group: "test",
          order: 11,
          color: "#676767",
    
          label: "Test",
          icon: "fa:wrench",
    
          link: "/test/start",
    
          routeCondition: "**",
          activeCondition: "/test",
          //permission: "",
        });

        // Translations:
        factory.registerTranslationResolver(
          "en",
          "feedback",
          async () => await import("./translations/en.json")
        );
    
        factory.registerTranslationResolver(
          "de",
          "feedback",
          async () => await import("./translations/de.json")
        );
      }
    }