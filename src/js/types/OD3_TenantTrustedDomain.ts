import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_TenantTrustedDomainAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  host: string;
  tenant: OD3_Tenant;
}

export class OD3_TenantTrustedDomain extends Parse.Object<OD3_TenantTrustedDomainAttributes> {
  static className: string = "OD3_TenantTrustedDomain";

  constructor(data?: Partial<OD3_TenantTrustedDomainAttributes>) {
    super("OD3_TenantTrustedDomain", data as OD3_TenantTrustedDomainAttributes);
  }

  get host(): string {
    return super.get("host");
  }
  set host(value: string) {
    super.set("host", value);
  }
  get tenant(): OD3_Tenant {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_TenantTrustedDomain", OD3_TenantTrustedDomain);
