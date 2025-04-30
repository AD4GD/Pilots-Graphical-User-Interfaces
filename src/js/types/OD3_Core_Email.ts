import Parse from "parse";

export interface OD3_Core_EmailAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  error: boolean;
  payload: any;
  response?: any;
  sent: boolean;
  success: boolean;
}

export class OD3_Core_Email extends Parse.Object<OD3_Core_EmailAttributes> {
  static className: string = "OD3_Core_Email";

  constructor(data?: Partial<OD3_Core_EmailAttributes>) {
    super("OD3_Core_Email", data as OD3_Core_EmailAttributes);
  }

  get error(): boolean {
    return super.get("error");
  }
  set error(value: boolean) {
    super.set("error", value);
  }
  get payload(): any {
    return super.get("payload");
  }
  set payload(value: any) {
    super.set("payload", value);
  }
  get response(): any | undefined {
    return super.get("response");
  }
  set response(value: any | undefined) {
    super.set("response", value);
  }
  get sent(): boolean {
    return super.get("sent");
  }
  set sent(value: boolean) {
    super.set("sent", value);
  }
  get success(): boolean {
    return super.get("success");
  }
  set success(value: boolean) {
    super.set("success", value);
  }
}

Parse.Object.registerSubclass("OD3_Core_Email", OD3_Core_Email);
