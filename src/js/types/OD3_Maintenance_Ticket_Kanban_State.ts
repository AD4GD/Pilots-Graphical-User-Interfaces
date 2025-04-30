import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Kanban_State = Parse.Object;
type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Ticket_Kanban_StateAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  state: OD3_Maintenance_Kanban_State;
  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
}

export class OD3_Maintenance_Ticket_Kanban_State extends Parse.Object<OD3_Maintenance_Ticket_Kanban_StateAttributes> {
  static className: string = "OD3_Maintenance_Ticket_Kanban_State";

  constructor(data?: Partial<OD3_Maintenance_Ticket_Kanban_StateAttributes>) {
    super("OD3_Maintenance_Ticket_Kanban_State", data as OD3_Maintenance_Ticket_Kanban_StateAttributes);
  }

  get state(): OD3_Maintenance_Kanban_State {
    return super.get("state");
  }
  set state(value: OD3_Maintenance_Kanban_State) {
    super.set("state", value);
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

Parse.Object.registerSubclass("OD3_Maintenance_Ticket_Kanban_State", OD3_Maintenance_Ticket_Kanban_State);
