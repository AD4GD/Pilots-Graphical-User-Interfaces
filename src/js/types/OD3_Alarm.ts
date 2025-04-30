import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_AlarmAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  action?: any;
  condition?: any;
  item_dimension?: number;
  item_id?: string;
  item_source?: string;
  name?: string;
  trigger?: any;
  user: _User;
}

export class OD3_Alarm extends Parse.Object<OD3_AlarmAttributes> {
  static className: string = "OD3_Alarm";

  constructor(data?: Partial<OD3_AlarmAttributes>) {
    super("OD3_Alarm", data as OD3_AlarmAttributes);
  }

  get action(): any | undefined {
    return super.get("action");
  }
  set action(value: any | undefined) {
    super.set("action", value);
  }
  get condition(): any | undefined {
    return super.get("condition");
  }
  set condition(value: any | undefined) {
    super.set("condition", value);
  }
  get item_dimension(): number | undefined {
    return super.get("item_dimension");
  }
  set item_dimension(value: number | undefined) {
    super.set("item_dimension", value);
  }
  get item_id(): string | undefined {
    return super.get("item_id");
  }
  set item_id(value: string | undefined) {
    super.set("item_id", value);
  }
  get item_source(): string | undefined {
    return super.get("item_source");
  }
  set item_source(value: string | undefined) {
    super.set("item_source", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get trigger(): any | undefined {
    return super.get("trigger");
  }
  set trigger(value: any | undefined) {
    super.set("trigger", value);
  }
  get user(): _User {
    return super.get("user");
  }
  set user(value: _User) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_Alarm", OD3_Alarm);
