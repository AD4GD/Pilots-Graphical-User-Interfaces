import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Source = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Ticket_SourceAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  source: OD3_Source;
  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
}

export class OD3_Maintenance_Ticket_Source extends Parse.Object<OD3_Maintenance_Ticket_SourceAttributes> {
  static className: string = "OD3_Maintenance_Ticket_Source";

  constructor(data?: Partial<OD3_Maintenance_Ticket_SourceAttributes>) {
    super("OD3_Maintenance_Ticket_Source", data as OD3_Maintenance_Ticket_SourceAttributes);
  }

  get source(): OD3_Source {
    return super.get("source");
  }
  set source(value: OD3_Source) {
    super.set("source", value);
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

Parse.Object.registerSubclass("OD3_Maintenance_Ticket_Source", OD3_Maintenance_Ticket_Source);
