import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_ItemAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  name: string;
  tenant: OD3_Tenant;
}

export class OD3_Maintenance_Item extends Parse.Object<OD3_Maintenance_ItemAttributes> {
  static className: string = "OD3_Maintenance_Item";

  constructor(data?: Partial<OD3_Maintenance_ItemAttributes>) {
    super("OD3_Maintenance_Item", data as OD3_Maintenance_ItemAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get name(): string {
    return super.get("name");
  }
  set name(value: string) {
    super.set("name", value);
  }
  get tenant(): OD3_Tenant {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Item", OD3_Maintenance_Item);
