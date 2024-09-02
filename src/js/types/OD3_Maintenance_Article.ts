import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Media = Parse.Object;
type OD3_Maintenance_Ticket = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_ArticleAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  body?: string;
  media: Parse.Relation<OD3_Maintenance_Article, OD3_Maintenance_Media>;
  subject?: string;
  tenant?: OD3_Tenant;
  ticket: OD3_Maintenance_Ticket;
  user?: _User;
}

export class OD3_Maintenance_Article extends Parse.Object<OD3_Maintenance_ArticleAttributes> {
  static className: string = "OD3_Maintenance_Article";

  constructor(data?: Partial<OD3_Maintenance_ArticleAttributes>) {
    super("OD3_Maintenance_Article", data as OD3_Maintenance_ArticleAttributes);
  }

  get body(): string | undefined {
    return super.get("body");
  }
  set body(value: string | undefined) {
    super.set("body", value);
  }
  get media(): Parse.Relation<OD3_Maintenance_Article, OD3_Maintenance_Media> {
    return super.relation("media");
  }
  get subject(): string | undefined {
    return super.get("subject");
  }
  set subject(value: string | undefined) {
    super.set("subject", value);
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

Parse.Object.registerSubclass("OD3_Maintenance_Article", OD3_Maintenance_Article);
