import Parse from "parse";

type OD3_Maintenance_Item = Parse.Object;
type OD3_Source = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_SourceMetaAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  item?: OD3_Maintenance_Item;
  source: OD3_Source;
  tenant: OD3_Tenant;
}

export class OD3_Maintenance_SourceMeta extends Parse.Object<OD3_Maintenance_SourceMetaAttributes> {
  static className: string = "OD3_Maintenance_SourceMeta";

  constructor(data?: Partial<OD3_Maintenance_SourceMetaAttributes>) {
    super("OD3_Maintenance_SourceMeta", data as OD3_Maintenance_SourceMetaAttributes);
  }

  get item(): OD3_Maintenance_Item | undefined {
    return super.get("item");
  }
  set item(value: OD3_Maintenance_Item | undefined) {
    super.set("item", value);
  }
  get source(): OD3_Source {
    return super.get("source");
  }
  set source(value: OD3_Source) {
    super.set("source", value);
  }
  get tenant(): OD3_Tenant {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_SourceMeta", OD3_Maintenance_SourceMeta);
