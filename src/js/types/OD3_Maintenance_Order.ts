import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Ticket = Parse.Object;

export interface OD3_Maintenance_OrderAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  tickets: Parse.Relation<OD3_Maintenance_Order, OD3_Maintenance_Ticket>;
  title: string;
  user: _User;
}

export class OD3_Maintenance_Order extends Parse.Object<OD3_Maintenance_OrderAttributes> {
  static className: string = "OD3_Maintenance_Order";

  constructor(data?: Partial<OD3_Maintenance_OrderAttributes>) {
    super("OD3_Maintenance_Order", data as OD3_Maintenance_OrderAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get tickets(): Parse.Relation<OD3_Maintenance_Order, OD3_Maintenance_Ticket> {
    return super.relation("tickets");
  }
  get title(): string {
    return super.get("title");
  }
  set title(value: string) {
    super.set("title", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Order", OD3_Maintenance_Order);
