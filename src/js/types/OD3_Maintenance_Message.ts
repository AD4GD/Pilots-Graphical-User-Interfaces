import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_Maintenance_MessageAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  classname: string;
  data?: any;
  referencedObjectId: string;
  title?: string;
  user?: _User;
}

export class OD3_Maintenance_Message extends Parse.Object<OD3_Maintenance_MessageAttributes> {
  static className: string = "OD3_Maintenance_Message";

  constructor(data?: Partial<OD3_Maintenance_MessageAttributes>) {
    super("OD3_Maintenance_Message", data as OD3_Maintenance_MessageAttributes);
  }

  get classname(): string {
    return super.get("classname");
  }
  set classname(value: string) {
    super.set("classname", value);
  }
  get data(): any | undefined {
    return super.get("data");
  }
  set data(value: any | undefined) {
    super.set("data", value);
  }
  get referencedObjectId(): string {
    return super.get("referencedObjectId");
  }
  set referencedObjectId(value: string) {
    super.set("referencedObjectId", value);
  }
  get title(): string | undefined {
    return super.get("title");
  }
  set title(value: string | undefined) {
    super.set("title", value);
  }
  get user(): _User | undefined {
    return super.get("user");
  }
  set user(value: _User | undefined) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Message", OD3_Maintenance_Message);
