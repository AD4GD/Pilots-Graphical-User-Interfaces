import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_AlarmActionAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  extra: any;
  formFields: any[];
  label: string;
  payload: string;
  supportedTypes: any[];
  target?: string;
  templateType: string;
  tenant?: OD3_Tenant;
  topic: string;
  type: string;
}

export class OD3_AlarmAction extends Parse.Object<OD3_AlarmActionAttributes> {
  static className: string = "OD3_AlarmAction";

  constructor(data?: Partial<OD3_AlarmActionAttributes>) {
    super("OD3_AlarmAction", data as OD3_AlarmActionAttributes);
  }

  get extra(): any {
    return super.get("extra");
  }
  set extra(value: any) {
    super.set("extra", value);
  }
  get formFields(): any[] {
    return super.get("formFields");
  }
  set formFields(value: any[]) {
    super.set("formFields", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get payload(): string {
    return super.get("payload");
  }
  set payload(value: string) {
    super.set("payload", value);
  }
  get supportedTypes(): any[] {
    return super.get("supportedTypes");
  }
  set supportedTypes(value: any[]) {
    super.set("supportedTypes", value);
  }
  get target(): string | undefined {
    return super.get("target");
  }
  set target(value: string | undefined) {
    super.set("target", value);
  }
  get templateType(): string {
    return super.get("templateType");
  }
  set templateType(value: string) {
    super.set("templateType", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
  get topic(): string {
    return super.get("topic");
  }
  set topic(value: string) {
    super.set("topic", value);
  }
  get type(): string {
    return super.get("type");
  }
  set type(value: string) {
    super.set("type", value);
  }
}

Parse.Object.registerSubclass("OD3_AlarmAction", OD3_AlarmAction);
