import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Issuecategory = Parse.Object;
type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Ticket_IssuecategoryAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  issuecategory: OD3_Maintenance_Issuecategory;
  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
}

export class OD3_Maintenance_Ticket_Issuecategory extends Parse.Object<OD3_Maintenance_Ticket_IssuecategoryAttributes> {
  static className: string = "OD3_Maintenance_Ticket_Issuecategory";

  constructor(data?: Partial<OD3_Maintenance_Ticket_IssuecategoryAttributes>) {
    super("OD3_Maintenance_Ticket_Issuecategory", data as OD3_Maintenance_Ticket_IssuecategoryAttributes);
  }

  get issuecategory(): OD3_Maintenance_Issuecategory {
    return super.get("issuecategory");
  }
  set issuecategory(value: OD3_Maintenance_Issuecategory) {
    super.set("issuecategory", value);
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

Parse.Object.registerSubclass("OD3_Maintenance_Ticket_Issuecategory", OD3_Maintenance_Ticket_Issuecategory);
