import Parse from "parse";

type OD3_Source = Parse.Object;

export interface AccessPermissionsAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  delete?: string;
  owner?: string;
  read?: string;
  source?: OD3_Source;
  write?: string;
}

export class AccessPermissions extends Parse.Object<AccessPermissionsAttributes> {
  static className: string = "AccessPermissions";

  constructor(data?: Partial<AccessPermissionsAttributes>) {
    super("AccessPermissions", data as AccessPermissionsAttributes);
  }

  get delete(): string | undefined {
    return super.get("delete");
  }
  set delete(value: string | undefined) {
    super.set("delete", value);
  }
  get owner(): string | undefined {
    return super.get("owner");
  }
  set owner(value: string | undefined) {
    super.set("owner", value);
  }
  get read(): string | undefined {
    return super.get("read");
  }
  set read(value: string | undefined) {
    super.set("read", value);
  }
  get source(): OD3_Source | undefined {
    return super.get("source");
  }
  set source(value: OD3_Source | undefined) {
    super.set("source", value);
  }
  get write(): string | undefined {
    return super.get("write");
  }
  set write(value: string | undefined) {
    super.set("write", value);
  }
}

Parse.Object.registerSubclass("AccessPermissions", AccessPermissions);
