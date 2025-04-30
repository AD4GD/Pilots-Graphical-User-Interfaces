import Parse from "parse";

type OD3_Maintenance_Media = Parse.Object;
type OD3_Source = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_ScheduleAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  enabled: boolean;
  media: Parse.Relation<OD3_Maintenance_Schedule, OD3_Maintenance_Media>;
  run_cron?: string;
  run_timestamp?: Date;
  source: OD3_Source;
  tenant?: OD3_Tenant;
  title: string;
}

export class OD3_Maintenance_Schedule extends Parse.Object<OD3_Maintenance_ScheduleAttributes> {
  static className: string = "OD3_Maintenance_Schedule";

  constructor(data?: Partial<OD3_Maintenance_ScheduleAttributes>) {
    super("OD3_Maintenance_Schedule", data as OD3_Maintenance_ScheduleAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get enabled(): boolean {
    return super.get("enabled");
  }
  set enabled(value: boolean) {
    super.set("enabled", value);
  }
  get media(): Parse.Relation<OD3_Maintenance_Schedule, OD3_Maintenance_Media> {
    return super.relation("media");
  }
  get run_cron(): string | undefined {
    return super.get("run_cron");
  }
  set run_cron(value: string | undefined) {
    super.set("run_cron", value);
  }
  get run_timestamp(): Date | undefined {
    return super.get("run_timestamp");
  }
  set run_timestamp(value: Date | undefined) {
    super.set("run_timestamp", value);
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
  get title(): string {
    return super.get("title");
  }
  set title(value: string) {
    super.set("title", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Schedule", OD3_Maintenance_Schedule);
