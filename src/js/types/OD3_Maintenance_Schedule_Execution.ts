import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Media = Parse.Object;
type OD3_Maintenance_Schedule = Parse.Object;
type OD3_Source = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Schedule_ExecutionAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  finishedAt?: Date;
  media: Parse.Relation<OD3_Maintenance_Schedule_Execution, OD3_Maintenance_Media>;
  origin?: OD3_Maintenance_Schedule;
  source?: OD3_Source;
  tenant?: OD3_Tenant;
  title?: string;
  user: _User;
}

export class OD3_Maintenance_Schedule_Execution extends Parse.Object<OD3_Maintenance_Schedule_ExecutionAttributes> {
  static className: string = "OD3_Maintenance_Schedule_Execution";

  constructor(data?: Partial<OD3_Maintenance_Schedule_ExecutionAttributes>) {
    super("OD3_Maintenance_Schedule_Execution", data as OD3_Maintenance_Schedule_ExecutionAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get finishedAt(): Date | undefined {
    return super.get("finishedAt");
  }
  set finishedAt(value: Date | undefined) {
    super.set("finishedAt", value);
  }
  get media(): Parse.Relation<OD3_Maintenance_Schedule_Execution, OD3_Maintenance_Media> {
    return super.relation("media");
  }
  get origin(): OD3_Maintenance_Schedule | undefined {
    return super.get("origin");
  }
  set origin(value: OD3_Maintenance_Schedule | undefined) {
    super.set("origin", value);
  }
  get source(): OD3_Source | undefined {
    return super.get("source");
  }
  set source(value: OD3_Source | undefined) {
    super.set("source", value);
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
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Schedule_Execution", OD3_Maintenance_Schedule_Execution);
