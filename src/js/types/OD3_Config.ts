import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_ConfigAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  key: string;
  priority: number;
  tenant?: OD3_Tenant;
  value: string;
}

export class OD3_Config extends Parse.Object<OD3_ConfigAttributes> {
  static className: string = "OD3_Config";

  constructor(data?: Partial<OD3_ConfigAttributes>) {
    super("OD3_Config", data as OD3_ConfigAttributes);
  }

  get key(): string {
    return super.get("key");
  }
  set key(value: string) {
    super.set("key", value);
  }
  get priority(): number {
    return super.get("priority");
  }
  set priority(value: number) {
    super.set("priority", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get value(): string {
    return super.get("value");
  }
  set value(value: string) {
    super.set("value", value);
  }
}

Parse.Object.registerSubclass("OD3_Config", OD3_Config);
