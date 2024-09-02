import Parse from "parse";

type MIAAS_Geographies = Parse.Object;

export interface AD4GD_LakeMetaDataAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  area?: number;
  circumference?: number;
  district?: string;
  geography?: MIAAS_Geographies;
  name: string;
  swimmingUsage?: boolean;
}

export class AD4GD_LakeMetaData extends Parse.Object<AD4GD_LakeMetaDataAttributes> {
  static className: string = "AD4GD_LakeMetaData";

  constructor(data?: Partial<AD4GD_LakeMetaDataAttributes>) {
    super("AD4GD_LakeMetaData", data as AD4GD_LakeMetaDataAttributes);
  }

  get area(): number | undefined {
    return super.get("area");
  }
  set area(value: number | undefined) {
    super.set("area", value);
  }
  get circumference(): number | undefined {
    return super.get("circumference");
  }
  set circumference(value: number | undefined) {
    super.set("circumference", value);
  }
  get district(): string | undefined {
    return super.get("district");
  }
  set district(value: string | undefined) {
    super.set("district", value);
  }
  get geography(): MIAAS_Geographies | undefined {
    return super.get("geography");
  }
  set geography(value: MIAAS_Geographies | undefined) {
    super.set("geography", value);
  }
  get name(): string {
    return super.get("name");
  }
  set name(value: string) {
    super.set("name", value);
  }
  get swimmingUsage(): boolean | undefined {
    return super.get("swimmingUsage");
  }
  set swimmingUsage(value: boolean | undefined) {
    super.set("swimmingUsage", value);
  }
}

Parse.Object.registerSubclass("AD4GD_LakeMetaData", AD4GD_LakeMetaData);
