import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_DowntimeAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
  value: number;
}

export class OD3_Maintenance_Downtime extends Parse.Object<OD3_Maintenance_DowntimeAttributes> {
  static className: string = "OD3_Maintenance_Downtime";

  constructor(data?: Partial<OD3_Maintenance_DowntimeAttributes>) {
    super("OD3_Maintenance_Downtime", data as OD3_Maintenance_DowntimeAttributes);
  }

  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get ticket(): OD3_Maintenance_Ticket {
    return super.get("ticket");
  }
  set ticket(value: OD3_Maintenance_Ticket) {
    super.set("ticket", value);
  }
  get user(): _User | undefined {
    return super.get("user");
  }
  set user(value: _User | undefined) {
    super.set("user", value);
  }
  get value(): number {
    return super.get("value");
  }
  set value(value: number) {
    super.set("value", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Downtime", OD3_Maintenance_Downtime);
