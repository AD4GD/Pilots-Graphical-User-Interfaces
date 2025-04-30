import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_PushAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  data: any;
  installationId: string;
  label: string;
  type: string;
  user: _User;
}

export class OD3_Push extends Parse.Object<OD3_PushAttributes> {
  static className: string = "OD3_Push";

  constructor(data?: Partial<OD3_PushAttributes>) {
    super("OD3_Push", data as OD3_PushAttributes);
  }

  get data(): any {
    return super.get("data");
  }
  set data(value: any) {
    super.set("data", value);
  }
  get installationId(): string {
    return super.get("installationId");
  }
  set installationId(value: string) {
    super.set("installationId", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get type(): string {
    return super.get("type");
  }
  set type(value: string) {
    super.set("type", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Push", OD3_Push);
