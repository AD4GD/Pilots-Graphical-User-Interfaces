import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_SourceAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  children: Parse.Relation<OD3_Source, OD3_Source>;
  name?: string;
  parent?: OD3_Source;
  tag?: string;
  tenant?: OD3_Tenant;
}

export class OD3_Source extends Parse.Object<OD3_SourceAttributes> {
  static className: string = "OD3_Source";

  constructor(data?: Partial<OD3_SourceAttributes>) {
    super("OD3_Source", data as OD3_SourceAttributes);
  }

  get children(): Parse.Relation<OD3_Source, OD3_Source> {
    return super.relation("children");
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get parent(): OD3_Source | undefined {
    return super.get("parent");
  }
  set parent(value: OD3_Source | undefined) {
    super.set("parent", value);
  }
  get tag(): string | undefined {
    return super.get("tag");
  }
  set tag(value: string | undefined) {
    super.set("tag", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Source", OD3_Source);
