import Parse from "parse";

import type { _User } from "./_User";

type OD3_Maintenance_Message = Parse.Object;

export interface OD3_Maintenance_Message_BodyAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  content?: string;
  message?: OD3_Maintenance_Message;
  user?: _User;
}

export class OD3_Maintenance_Message_Body extends Parse.Object<OD3_Maintenance_Message_BodyAttributes> {
  static className: string = "OD3_Maintenance_Message_Body";

  constructor(data?: Partial<OD3_Maintenance_Message_BodyAttributes>) {
    super("OD3_Maintenance_Message_Body", data as OD3_Maintenance_Message_BodyAttributes);
  }

  get content(): string | undefined {
    return super.get("content");
  }
  set content(value: string | undefined) {
    super.set("content", value);
  }
  get message(): OD3_Maintenance_Message | undefined {
    return super.get("message");
  }
  set message(value: OD3_Maintenance_Message | undefined) {
    super.set("message", value);
  }
  get user(): _User | undefined {
    return super.get("user");
  }
  set user(value: _User | undefined) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Message_Body", OD3_Maintenance_Message_Body);
