import Parse from "parse";

type OD3_Tenant = Parse.Object;

export interface OD3_NavigationItemAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  activeCondition?: string;
  color?: string;
  event?: string;
  group?: string;
  icon?: string;
  label: string;
  link?: string;
  name?: string;
  order: number;
  place: string;
  routeCondition?: string;
  tenant?: OD3_Tenant;
}

export class OD3_NavigationItem extends Parse.Object<OD3_NavigationItemAttributes> {
  static className: string = "OD3_NavigationItem";

  constructor(data?: Partial<OD3_NavigationItemAttributes>) {
    super("OD3_NavigationItem", data as OD3_NavigationItemAttributes);
  }

  get activeCondition(): string | undefined {
    return super.get("activeCondition");
  }
  set activeCondition(value: string | undefined) {
    super.set("activeCondition", value);
  }
  get color(): string | undefined {
    return super.get("color");
  }
  set color(value: string | undefined) {
    super.set("color", value);
  }
  get event(): string | undefined {
    return super.get("event");
  }
  set event(value: string | undefined) {
    super.set("event", value);
  }
  get group(): string | undefined {
    return super.get("group");
  }
  set group(value: string | undefined) {
    super.set("group", value);
  }
  get icon(): string | undefined {
    return super.get("icon");
  }
  set icon(value: string | undefined) {
    super.set("icon", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get link(): string | undefined {
    return super.get("link");
  }
  set link(value: string | undefined) {
    super.set("link", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get order(): number {
    return super.get("order");
  }
  set order(value: number) {
    super.set("order", value);
  }
  get place(): string {
    return super.get("place");
  }
  set place(value: string) {
    super.set("place", value);
  }
  get routeCondition(): string | undefined {
    return super.get("routeCondition");
  }
  set routeCondition(value: string | undefined) {
    super.set("routeCondition", value);
  }
  get tenant(): OD3_Tenant | undefined {
    return super.get("tenant");
  }
  set tenant(value: OD3_Tenant | undefined) {
    super.set("tenant", value);
  }
}

Parse.Object.registerSubclass("OD3_NavigationItem", OD3_NavigationItem);
