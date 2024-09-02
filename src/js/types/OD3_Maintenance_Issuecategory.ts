import Parse from "parse";

type OD3_Source = Parse.Object;
type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_IssuecategoryAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  catchall: boolean;
  enabled: boolean;
  icon?: string;
  issuecode?: string;
  name: string;
  parent?: OD3_Maintenance_Issuecategory;
  source: Parse.Relation<OD3_Maintenance_Issuecategory, OD3_Source>;
  tenant?: OD3_Tenant;
}

export class OD3_Maintenance_Issuecategory extends Parse.Object<OD3_Maintenance_IssuecategoryAttributes> {
  static className: string = "OD3_Maintenance_Issuecategory";

  constructor(data?: Partial<OD3_Maintenance_IssuecategoryAttributes>) {
    super("OD3_Maintenance_Issuecategory", data as OD3_Maintenance_IssuecategoryAttributes);
  }

  get catchall(): boolean {
    return super.get("catchall");
  }
  set catchall(value: boolean) {
    super.set("catchall", value);
  }
  get enabled(): boolean {
    return super.get("enabled");
  }
  set enabled(value: boolean) {
    super.set("enabled", value);
  }
  get icon(): string | undefined {
    return super.get("icon");
  }
  set icon(value: string | undefined) {
    super.set("icon", value);
  }
  get issuecode(): string | undefined {
    return super.get("issuecode");
  }
  set issuecode(value: string | undefined) {
    super.set("issuecode", value);
  }
  get name(): string {
    return super.get("name");
  }
  set name(value: string) {
    super.set("name", value);
  }
  get parent(): OD3_Maintenance_Issuecategory | undefined {
    return super.get("parent");
  }
  set parent(value: OD3_Maintenance_Issuecategory | undefined) {
    super.set("parent", value);
  }
  get source(): Parse.Relation<OD3_Maintenance_Issuecategory, OD3_Source> {
    return super.relation("source");
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Issuecategory", OD3_Maintenance_Issuecategory);
