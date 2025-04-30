import Parse from "parse";

export interface OD3_LogAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  references: any;
  type: string;
}

export class OD3_Log extends Parse.Object<OD3_LogAttributes> {
  static className: string = "OD3_Log";

  constructor(data?: Partial<OD3_LogAttributes>) {
    super("OD3_Log", data as OD3_LogAttributes);
  }

  get references(): any {
    return super.get("references");
  }
  set references(value: any) {
    super.set("references", value);
  }
  get type(): string {
    return super.get("type");
  }
  set type(value: string) {
    super.set("type", value);
  }
}

Parse.Object.registerSubclass("OD3_Log", OD3_Log);
