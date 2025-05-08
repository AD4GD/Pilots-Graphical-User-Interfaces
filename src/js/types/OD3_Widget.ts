import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_WidgetAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  config?: any;
  name?: string;
  type?: string;
  user: _User;
}

export class OD3_Widget extends Parse.Object<OD3_WidgetAttributes> {
  static className: string = "OD3_Widget";

  constructor(data?: Partial<OD3_WidgetAttributes>) {
    super("OD3_Widget", data as OD3_WidgetAttributes);
  }

  get config(): any | undefined {
    return super.get("config");
  }
  set config(value: any | undefined) {
    super.set("config", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get type(): string | undefined {
    return super.get("type");
  }
  set type(value: string | undefined) {
    super.set("type", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Widget", OD3_Widget);
