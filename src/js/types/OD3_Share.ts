import Parse from "parse";

import type { _Role } from "./_Role";
import type { _User } from "./_User";

export interface OD3_ShareAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  accepted: boolean;
  key: string;
  targetRole?: _Role;
  targetUser?: _User;
  type: string;
  user: _User;
  writePermission: boolean;
}

export class OD3_Share extends Parse.Object<OD3_ShareAttributes> {
  static className: string = "OD3_Share";

  constructor(data?: Partial<OD3_ShareAttributes>) {
    super("OD3_Share", data as OD3_ShareAttributes);
  }

  get accepted(): boolean {
    return super.get("accepted");
  }
  set accepted(value: boolean) {
    super.set("accepted", value);
  }
  get key(): string {
    return super.get("key");
  }
  set key(value: string) {
    super.set("key", value);
  }
  get targetRole(): _Role | undefined {
    return super.get("targetRole");
  }
  set targetRole(value: _Role | undefined) {
    super.set("targetRole", value);
  }
  get targetUser(): _User | undefined {
    return super.get("targetUser");
  }
  set targetUser(value: _User | undefined) {
    super.set("targetUser", value);
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
  get writePermission(): boolean {
    return super.get("writePermission");
  }
  set writePermission(value: boolean) {
    super.set("writePermission", value);
  }
}

Parse.Object.registerSubclass("OD3_Share", OD3_Share);
