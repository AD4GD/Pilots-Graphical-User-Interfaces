import Parse from "parse";

type OD3_Group = Parse.Object;
type OD3_Maintenance_Schedule = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Schedule_StepAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  group: OD3_Group;
  location?: string;
  protectivegear?: string;
  schedule: OD3_Maintenance_Schedule;
  tenant?: OD3_Tenant;
  type?: string;
  usedmaterial?: string;
}

export class OD3_Maintenance_Schedule_Step extends Parse.Object<OD3_Maintenance_Schedule_StepAttributes> {
  static className: string = "OD3_Maintenance_Schedule_Step";

  constructor(data?: Partial<OD3_Maintenance_Schedule_StepAttributes>) {
    super("OD3_Maintenance_Schedule_Step", data as OD3_Maintenance_Schedule_StepAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get group(): OD3_Group {
    return super.get("group");
  }
  set group(value: OD3_Group) {
    super.set("group", value);
  }
  get location(): string | undefined {
    return super.get("location");
  }
  set location(value: string | undefined) {
    super.set("location", value);
  }
  get protectivegear(): string | undefined {
    return super.get("protectivegear");
  }
  set protectivegear(value: string | undefined) {
    super.set("protectivegear", value);
  }
  get schedule(): OD3_Maintenance_Schedule {
    return super.get("schedule");
  }
  set schedule(value: OD3_Maintenance_Schedule) {
    super.set("schedule", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get type(): string | undefined {
    return super.get("type");
  }
  set type(value: string | undefined) {
    super.set("type", value);
  }
  get usedmaterial(): string | undefined {
    return super.get("usedmaterial");
  }
  set usedmaterial(value: string | undefined) {
    super.set("usedmaterial", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Schedule_Step", OD3_Maintenance_Schedule_Step);
