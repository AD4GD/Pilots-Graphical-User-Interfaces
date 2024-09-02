import Parse from "parse";

import type { _User } from "./_User";

type OD3_Source = Parse.Object;

export interface OD3_DashboardAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  heroWidget?: string;
  layout?: any[];
  name?: string;
  source?: OD3_Source;
  type: string;
  user: _User;
  widgets?: any[];
}

export class OD3_Dashboard extends Parse.Object<OD3_DashboardAttributes> {
  static className: string = "OD3_Dashboard";

  constructor(data?: Partial<OD3_DashboardAttributes>) {
    super("OD3_Dashboard", data as OD3_DashboardAttributes);
  }

  get heroWidget(): string | undefined {
    return super.get("heroWidget");
  }
  set heroWidget(value: string | undefined) {
    super.set("heroWidget", value);
  }
  get layout(): any[] | undefined {
    return super.get("layout");
  }
  set layout(value: any[] | undefined) {
    super.set("layout", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get source(): OD3_Source | undefined {
    return super.get("source");
  }
  set source(value: OD3_Source | undefined) {
    super.set("source", value);
  }
  get type(): string {
    return super.get("type");
  }
  set type(value: string) {
    super.set("type", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
  get widgets(): any[] | undefined {
    return super.get("widgets");
  }
  set widgets(value: any[] | undefined) {
    super.set("widgets", value);
  }
}

Parse.Object.registerSubclass("OD3_Dashboard", OD3_Dashboard);
