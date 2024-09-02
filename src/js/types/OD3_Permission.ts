import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_PermissionAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  key: string;
  tenant?: OD3_Tenant;
}

export class OD3_Permission extends Parse.Object<OD3_PermissionAttributes> {
  static className: string = "OD3_Permission";

  constructor(data?: Partial<OD3_PermissionAttributes>) {
    super("OD3_Permission", data as OD3_PermissionAttributes);
  }

  get key(): string {
    return super.get("key");
  }
  set key(value: string) {
    super.set("key", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Permission", OD3_Permission);
