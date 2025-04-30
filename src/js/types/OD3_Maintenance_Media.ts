import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_MediaAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  filename: string;
  media: Parse.File;
  tenant?: OD3_Tenant;
}

export class OD3_Maintenance_Media extends Parse.Object<OD3_Maintenance_MediaAttributes> {
  static className: string = "OD3_Maintenance_Media";

  constructor(data?: Partial<OD3_Maintenance_MediaAttributes>) {
    super("OD3_Maintenance_Media", data as OD3_Maintenance_MediaAttributes);
  }

  get filename(): string {
    return super.get("filename");
  }
  set filename(value: string) {
    super.set("filename", value);
  }
  get media(): Parse.File {
    return super.get("media");
  }
  set media(value: Parse.File) {
    super.set("media", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Media", OD3_Maintenance_Media);
