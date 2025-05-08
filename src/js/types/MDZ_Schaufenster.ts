import Parse from "parse";

export interface MDZ_SchaufensterAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  content: string;
  description: string;
  enabled: boolean;
  firstSlide: string;
  imgSrc?: string;
  label: string;
  tOptions?: any;
}

export class MDZ_Schaufenster extends Parse.Object<MDZ_SchaufensterAttributes> {
  static className: string = "MDZ_Schaufenster";

  constructor(data?: Partial<MDZ_SchaufensterAttributes>) {
    super("MDZ_Schaufenster", data as MDZ_SchaufensterAttributes);
  }

  get content(): string {
    return super.get("content");
  }
  set content(value: string) {
    super.set("content", value);
  }
  get description(): string {
    return super.get("description");
  }
  set description(value: string) {
    super.set("description", value);
  }
  get enabled(): boolean {
    return super.get("enabled");
  }
  set enabled(value: boolean) {
    super.set("enabled", value);
  }
  get firstSlide(): string {
    return super.get("firstSlide");
  }
  set firstSlide(value: string) {
    super.set("firstSlide", value);
  }
  get imgSrc(): string | undefined {
    return super.get("imgSrc");
  }
  set imgSrc(value: string | undefined) {
    super.set("imgSrc", value);
  }
  get label(): string {
    return super.get("label");
  }
  set label(value: string) {
    super.set("label", value);
  }
  get tOptions(): any | undefined {
    return super.get("tOptions");
  }
  set tOptions(value: any | undefined) {
    super.set("tOptions", value);
  }
}

Parse.Object.registerSubclass("MDZ_Schaufenster", MDZ_Schaufenster);
