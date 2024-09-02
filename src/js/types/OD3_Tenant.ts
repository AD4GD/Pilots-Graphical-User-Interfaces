import Parse from "parse";

type OD3_Source = Parse.Object;

export interface OD3_TenantAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  dataProtectionUrl: string;
  dataSource?: OD3_Source;
  description: string;
  hasDataSource: boolean;
  icon?: Parse.File;
  imprintUrl: string;
  interactWithOtherTenants: boolean;
  label: string;
  logo?: Parse.File;
  public: boolean;
  tagPrefix?: string;
}

export class OD3_Tenant extends Parse.Object<OD3_TenantAttributes> {
  static className: string = "OD3_Tenant";

  constructor(data?: Partial<OD3_TenantAttributes>) {
    super("OD3_Tenant", data as OD3_TenantAttributes);
  }

  get dataProtectionUrl(): string {
    return super.get("dataProtectionUrl");
  }
  set dataProtectionUrl(value: string) {
    super.set("dataProtectionUrl", value);
  }
  get dataSource(): OD3_Source | undefined {
    return super.get("dataSource");
  }
  set dataSource(value: OD3_Source | undefined) {
    super.set("dataSource", value);
  }
  get description(): string {
    return super.get("description");
  }
  set description(value: string) {
    super.set("description", value);
  }
  get hasDataSource(): boolean {
    return super.get("hasDataSource");
  }
  set hasDataSource(value: boolean) {
    super.set("hasDataSource", value);
  }
  get icon(): Parse.File | undefined {
    return super.get("icon");
  }
  set icon(value: Parse.File | undefined) {
    super.set("icon", value);
  }
  get imprintUrl(): string {
    return super.get("imprintUrl");
  }
  set imprintUrl(value: string) {
    super.set("imprintUrl", value);
  }
  get interactWithOtherTenants(): boolean {
    return super.get("interactWithOtherTenants");
  }
  set interactWithOtherTenants(value: boolean) {
    super.set("interactWithOtherTenants", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get logo(): Parse.File | undefined {
    return super.get("logo");
  }
  set logo(value: Parse.File | undefined) {
    super.set("logo", value);
  }
  get public(): boolean {
    return super.get("public");
  }
  set public(value: boolean) {
    super.set("public", value);
  }
  get tagPrefix(): string | undefined {
    return super.get("tagPrefix");
  }
  set tagPrefix(value: string | undefined) {
    super.set("tagPrefix", value);
  }
}

Parse.Object.registerSubclass("OD3_Tenant", OD3_Tenant);
