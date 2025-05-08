import Parse from "parse";

import type { _User } from "./_User";

type OD3_Group = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_TicketAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  assignedgroups: Parse.Relation<OD3_Maintenance_Ticket, OD3_Group>;
  assignedusers: Parse.Relation<OD3_Maintenance_Ticket, _User>;
  enabled: boolean;
  tenant?: OD3_Tenant;
  title?: string;
  user?: _User;
}

export class OD3_Maintenance_Ticket extends Parse.Object<OD3_Maintenance_TicketAttributes> {
  static className: string = "OD3_Maintenance_Ticket";

  constructor(data?: Partial<OD3_Maintenance_TicketAttributes>) {
    super("OD3_Maintenance_Ticket", data as OD3_Maintenance_TicketAttributes);
  }

  get assignedgroups(): Parse.Relation<OD3_Maintenance_Ticket, OD3_Group> {
    return super.relation("assignedgroups");
  }
  get assignedusers(): Parse.Relation<OD3_Maintenance_Ticket, _User> {
    return super.relation("assignedusers");
  }
  get enabled(): boolean {
    return super.get("enabled");
  }
  set enabled(value: boolean) {
    super.set("enabled", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get title(): string | undefined {
    return super.get("title");
  }
  set title(value: string | undefined) {
    super.set("title", value);
  }
  get user(): _User | undefined {
    return super.get("user");
  }
  set user(value: _User | undefined) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Ticket", OD3_Maintenance_Ticket);
