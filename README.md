## Installing and Building

You will need Node (^18), npm (>=7) and pnpm (^8)

```
node --version
npm --version
npm i -g pnpm
```

and run the npm install for CI command:

```
pnpm i
```

To start a development web server which listens on port 8080 and listens for code changes to rebuild the website run the command

```
pnpm run start
```

To create a production deployment, which will end up in the ./dist folder, run the command.

```
pnpm run build
```

Put the content of the `./dist` folder on a web server, make sure to have a not-found fallback on `index.html` to allow client side routing.

### Widgets

Widgets are located in the `src/js/widgets` folder. To create a new widget, copy the folder of an existing widget, make sure to give it a fitting name and update the `type` property in the `index.ts` file.

Please use translation where ever possible and update the translation file in `src/js/translations/app/en.json`.

Example `example`:

- It's located in the `src/js/widgets/example` folder
- The type property is `opendash-widget-example`
- Translations use the `app:widget.example.xxx` namespace

Each widget has the following files:

- `index.ts` - For configuration and as an entrypoint
- `types.ts` - For widget specific typings, especially for typings of the widget config
- `component.ts` - The React component which will render the widget in the dashboard view
- `settings.ts` - (optionally) The React component which will render the settings dialog

### New Component

New Plugins can be located in the `src/js/components`folder. To create a new plugin, copy the folder of an existing plugin.

Please use translation where ever possible and update the translation file in `translations` folder.

Use the `AppPluginInterface` for the best integration. 

In your plugin.ts, you first need to register a route:

```
factory.registerRoute({
  path: "/test/start",
  props: this.options,
  component: async () => ({ default: TestComponent })
});
```

Afterwards, you can register the Navigation Item on the Frontpage:

```
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
  activeCondition: "/test"
});
```




Finally, in the index.ts of the instance, register the new plugin `await factory.use(new TestPlugin());`

