import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_NotificationAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  data: any;
  description?: string;
  iconPath?: string;
  isSent: boolean;
  title: string;
  user: _User;
}

export class OD3_Notification extends Parse.Object<OD3_NotificationAttributes> {
  static className: string = "OD3_Notification";

  constructor(data?: Partial<OD3_NotificationAttributes>) {
    super("OD3_Notification", data as OD3_NotificationAttributes);
  }

  get data(): any {
    return super.get("data");
  }
  set data(value: any) {
    super.set("data", value);
  }
  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get iconPath(): string | undefined {
    return super.get("iconPath");
  }
  set iconPath(value: string | undefined) {
    super.set("iconPath", value);
  }
  get isSent(): boolean {
    return super.get("isSent");
  }
  set isSent(value: boolean) {
    super.set("isSent", value);
  }
  get title(): string {
    return super.get("title");
  }
  set title(value: string) {
    super.set("title", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Notification", OD3_Notification);
