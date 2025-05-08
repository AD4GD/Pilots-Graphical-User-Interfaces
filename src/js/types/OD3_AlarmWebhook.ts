import Parse from "parse";

import type { _User } from "./_User";

type OD3_Tenant = Parse.Object;

export interface OD3_AlarmWebhookAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  comment?: string;
  extraOptions: any;
  header: any;
  method: string;
  name?: string;
  payload: string;
  tenant?: OD3_Tenant;
  url: string;
  user?: _User;
}

export class OD3_AlarmWebhook extends Parse.Object<OD3_AlarmWebhookAttributes> {
  static className: string = "OD3_AlarmWebhook";

  constructor(data?: Partial<OD3_AlarmWebhookAttributes>) {
    super("OD3_AlarmWebhook", data as OD3_AlarmWebhookAttributes);
  }

  get comment(): string | undefined {
    return super.get("comment");
  }
  set comment(value: string | undefined) {
    super.set("comment", value);
  }
  get extraOptions(): any {
    return super.get("extraOptions");
  }
  set extraOptions(value: any) {
    super.set("extraOptions", value);
  }
  get header(): any {
    return super.get("header");
  }
  set header(value: any) {
    super.set("header", value);
  }
  get method(): string {
    return super.get("method");
  }
  set method(value: string) {
    super.set("method", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get payload(): string {
    return super.get("payload");
  }
  set payload(value: string) {
    super.set("payload", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get url(): string {
    return super.get("url");
  }
  set url(value: string) {
    super.set("url", value);
  }
  get user(): _User | undefined {
    return super.get("user");
  }
  set user(value: _User | undefined) {
    super.set("user", value);
  }
}

Parse.Object.registerSubclass("OD3_AlarmWebhook", OD3_AlarmWebhook);
