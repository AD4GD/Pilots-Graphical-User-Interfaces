import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_NavigationGroupAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  icon?: string;
  label: string;
  order: number;
  tenant?: OD3_Tenant;
}

export class OD3_NavigationGroup extends Parse.Object<OD3_NavigationGroupAttributes> {
  static className: string = "OD3_NavigationGroup";

  constructor(data?: Partial<OD3_NavigationGroupAttributes>) {
    super("OD3_NavigationGroup", data as OD3_NavigationGroupAttributes);
  }

  get icon(): string | undefined {
    return super.get("icon");
  }
  set icon(value: string | undefined) {
    super.set("icon", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get order(): number {
    return super.get("order");
  }
  set order(value: number) {
    super.set("order", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_NavigationGroup", OD3_NavigationGroup);
