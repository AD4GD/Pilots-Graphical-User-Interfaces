import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_DuedateAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  end: Date;
  endformat: string;
  start?: Date;
  startformat: string;
  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
}

export class OD3_Maintenance_Duedate extends Parse.Object<OD3_Maintenance_DuedateAttributes> {
  static className: string = "OD3_Maintenance_Duedate";

  constructor(data?: Partial<OD3_Maintenance_DuedateAttributes>) {
    super("OD3_Maintenance_Duedate", data as OD3_Maintenance_DuedateAttributes);
  }

  get end(): Date {
    return super.get("end");
  }
  set end(value: Date) {
    super.set("end", value);
  }
  get endformat(): string {
    return super.get("endformat");
  }
  set endformat(value: string) {
    super.set("endformat", value);
  }
  get start(): Date | undefined {
    return super.get("start");
  }
  set start(value: Date | undefined) {
    super.set("start", value);
  }
  get startformat(): string {
    return super.get("startformat");
  }
  set startformat(value: string) {
    super.set("startformat", value);
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
}

Parse.Object.registerSubclass("OD3_Maintenance_Duedate", OD3_Maintenance_Duedate);
