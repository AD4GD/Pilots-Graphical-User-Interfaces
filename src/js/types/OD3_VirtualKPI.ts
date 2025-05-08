import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_VirtualKPIAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  pipe: any;
  template: any;
  tenant?: OD3_Tenant;
}

export class OD3_VirtualKPI extends Parse.Object<OD3_VirtualKPIAttributes> {
  static className: string = "OD3_VirtualKPI";

  constructor(data?: Partial<OD3_VirtualKPIAttributes>) {
    super("OD3_VirtualKPI", data as OD3_VirtualKPIAttributes);
  }

  get pipe(): any {
    return super.get("pipe");
  }
  set pipe(value: any) {
    super.set("pipe", value);
  }
  get template(): any {
    return super.get("template");
  }
  set template(value: any) {
    super.set("template", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_VirtualKPI", OD3_VirtualKPI);
