import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_UserDataAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  key?: string;
  user: _User;
  value?: string;
}

export class OD3_UserData extends Parse.Object<OD3_UserDataAttributes> {
  static className: string = "OD3_UserData";

  constructor(data?: Partial<OD3_UserDataAttributes>) {
    super("OD3_UserData", data as OD3_UserDataAttributes);
  }

  get key(): string | undefined {
    return super.get("key");
  }
  set key(value: string | undefined) {
    super.set("key", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
  get value(): string | undefined {
    return super.get("value");
  }
  set value(value: string | undefined) {
    super.set("value", value);
  }
}

Parse.Object.registerSubclass("OD3_UserData", OD3_UserData);
