import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_Maintenance_Kanban_StateAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  color: string;
  description?: string;
  isFinished: boolean;
  isInbox: boolean;
  label: string;
  order: number;
  tenant?: OD3_Tenant;
}

export class OD3_Maintenance_Kanban_State extends Parse.Object<OD3_Maintenance_Kanban_StateAttributes> {
  static className: string = "OD3_Maintenance_Kanban_State";

  constructor(data?: Partial<OD3_Maintenance_Kanban_StateAttributes>) {
    super("OD3_Maintenance_Kanban_State", data as OD3_Maintenance_Kanban_StateAttributes);
  }

  get color(): string {
    return super.get("color");
  }
  set color(value: string) {
    super.set("color", value);
  }
  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get isFinished(): boolean {
    return super.get("isFinished");
  }
  set isFinished(value: boolean) {
    super.set("isFinished", value);
  }
  get isInbox(): boolean {
    return super.get("isInbox");
  }
  set isInbox(value: boolean) {
    super.set("isInbox", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get order(): number {
    return super.get("order");
  }
  set order(value: number) {
    super.set("order", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_Maintenance_Kanban_State", OD3_Maintenance_Kanban_State);
