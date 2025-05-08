import Parse from "parse";

import type { _User } from "./_User";

export interface OD3_ReportAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description?: string;
  items: any[];
  masterData: any;
  name?: string;
  options: any;
  template: Parse.File;
  title?: string;
  type: string;
  user: _User;
}

export class OD3_Report extends Parse.Object<OD3_ReportAttributes> {
  static className: string = "OD3_Report";

  constructor(data?: Partial<OD3_ReportAttributes>) {
    super("OD3_Report", data as OD3_ReportAttributes);
  }

  get description(): string | undefined {
    return super.get("description");
  }
  set description(value: string | undefined) {
    super.set("description", value);
  }
  get items(): any[] {
    return super.get("items");
  }
  set items(value: any[]) {
    super.set("items", value);
  }
  get masterData(): any {
    return super.get("masterData");
  }
  set masterData(value: any) {
    super.set("masterData", value);
  }
  get name(): string | undefined {
    return super.get("name");
  }
  set name(value: string | undefined) {
    super.set("name", value);
  }
  get options(): any {
    return super.get("options");
  }
  set options(value: any) {
    super.set("options", value);
  }
  get template(): Parse.File {
    return super.get("template");
  }
  set template(value: Parse.File) {
    super.set("template", value);
  }
  get title(): string | undefined {
    return super.get("title");
  }
  set title(value: string | undefined) {
    super.set("title", value);
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
}

Parse.Object.registerSubclass("OD3_Report", OD3_Report);
