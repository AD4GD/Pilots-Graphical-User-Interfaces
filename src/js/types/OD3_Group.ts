import Parse from "parse";

import type { _User } from "./_User";

type OD3_Tenant = Parse.Object;

export interface OD3_GroupAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  label: string;
  parentGroup: Parse.Relation<OD3_Group, OD3_Group>;
  roleIsVisible: boolean;
  roleIsVisibleForTenant: boolean;
  tenant?: OD3_Tenant;
  users: Parse.Relation<OD3_Group, _User>;
  usersSeeEachOther: boolean;
}

export class OD3_Group extends Parse.Object<OD3_GroupAttributes> {
  static className: string = "OD3_Group";

  constructor(data?: Partial<OD3_GroupAttributes>) {
    super("OD3_Group", data as OD3_GroupAttributes);
  }

  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get parentGroup(): Parse.Relation<OD3_Group, OD3_Group> {
    return super.relation("parentGroup");
  }
  get roleIsVisible(): boolean {
    return super.get("roleIsVisible");
  }
  set roleIsVisible(value: boolean) {
    super.set("roleIsVisible", value);
  }
  get roleIsVisibleForTenant(): boolean {
    return super.get("roleIsVisibleForTenant");
  }
  set roleIsVisibleForTenant(value: boolean) {
    super.set("roleIsVisibleForTenant", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get users(): Parse.Relation<OD3_Group, _User> {
    return super.relation("users");
  }
  get usersSeeEachOther(): boolean {
    return super.get("usersSeeEachOther");
  }
  set usersSeeEachOther(value: boolean) {
    super.set("usersSeeEachOther", value);
  }
}

Parse.Object.registerSubclass("OD3_Group", OD3_Group);
