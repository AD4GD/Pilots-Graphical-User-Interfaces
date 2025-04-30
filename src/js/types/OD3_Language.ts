import Parse from "parse";

export interface OD3_LanguageAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  label: string;
}

export class OD3_Language extends Parse.Object<OD3_LanguageAttributes> {
  static className: string = "OD3_Language";

  constructor(data?: Partial<OD3_LanguageAttributes>) {
    super("OD3_Language", data as OD3_LanguageAttributes);
  }

  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
}

Parse.Object.registerSubclass("OD3_Language", OD3_Language);
