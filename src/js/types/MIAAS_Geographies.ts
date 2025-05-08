import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface MIAAS_GeographiesAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  geo: any;
  label: string;
  sensors: any[];
  tenant?: OD3_Tenant;
}

export class MIAAS_Geographies extends Parse.Object<MIAAS_GeographiesAttributes> {
  static className: string = "MIAAS_Geographies";

  constructor(data?: Partial<MIAAS_GeographiesAttributes>) {
    super("MIAAS_Geographies", data as MIAAS_GeographiesAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get geo(): any {
    return super.get("geo");
  }
  set geo(value: any) {
    super.set("geo", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get sensors(): any[] {
    return super.get("sensors");
  }
  set sensors(value: any[]) {
    super.set("sensors", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("MIAAS_Geographies", MIAAS_Geographies);
