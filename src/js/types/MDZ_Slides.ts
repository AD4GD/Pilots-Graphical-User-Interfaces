import Parse from "parse";

export interface MDZ_SlidesAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  content1?: string;
  content2?: string;
  enabled: boolean;
  headline: string;
  nextSlide: string;
  picture1?: string;
  picture2?: string;
  schaufensterId: string;
  slideNumber: number;
  subheadline: string;
  template: number;
}

export class MDZ_Slides extends Parse.Object<MDZ_SlidesAttributes> {
  static className: string = "MDZ_Slides";

  constructor(data?: Partial<MDZ_SlidesAttributes>) {
    super("MDZ_Slides", data as MDZ_SlidesAttributes);
  }

  get content1(): string | undefined {
    return super.get("content1");
  }
  set content1(value: string | undefined) {
    super.set("content1", value);
  }
  get content2(): string | undefined {
    return super.get("content2");
  }
  set content2(value: string | undefined) {
    super.set("content2", value);
  }
  get enabled(): boolean {
    return super.get("enabled");
  }
  set enabled(value: boolean) {
    super.set("enabled", value);
  }
  get headline(): string {
    return super.get("headline");
  }
  set headline(value: string) {
    super.set("headline", value);
  }
  get nextSlide(): string {
    return super.get("nextSlide");
  }
  set nextSlide(value: string) {
    super.set("nextSlide", value);
  }
  get picture1(): string | undefined {
    return super.get("picture1");
  }
  set picture1(value: string | undefined) {
    super.set("picture1", value);
  }
  get picture2(): string | undefined {
    return super.get("picture2");
  }
  set picture2(value: string | undefined) {
    super.set("picture2", value);
  }
  get schaufensterId(): string {
    return super.get("schaufensterId");
  }
  set schaufensterId(value: string) {
    super.set("schaufensterId", value);
  }
  get slideNumber(): number {
    return super.get("slideNumber");
  }
  set slideNumber(value: number) {
    super.set("slideNumber", value);
  }
  get subheadline(): string {
    return super.get("subheadline");
  }
  set subheadline(value: string) {
    super.set("subheadline", value);
  }
  get template(): number {
    return super.get("template");
  }
  set template(value: number) {
    super.set("template", value);
  }
}

Parse.Object.registerSubclass("MDZ_Slides", MDZ_Slides);
