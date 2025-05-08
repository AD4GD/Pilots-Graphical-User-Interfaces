import Parse from "parse";

export interface MDZ_SchaufensterExampleAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  content1?: string;
  content2?: string;
  enabled: boolean;
  headline?: string;
  imgSrc?: string;
  nextSlide: string;
  picture1?: string;
  picture2?: string;
  subheadline?: string;
  template: number;
  title?: string;
}

export class MDZ_SchaufensterExample extends Parse.Object<MDZ_SchaufensterExampleAttributes> {
  static className: string = "MDZ_SchaufensterExample";

  constructor(data?: Partial<MDZ_SchaufensterExampleAttributes>) {
    super("MDZ_SchaufensterExample", data as MDZ_SchaufensterExampleAttributes);
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
  get headline(): string | undefined {
    return super.get("headline");
  }
  set headline(value: string | undefined) {
    super.set("headline", value);
  }
  get imgSrc(): string | undefined {
    return super.get("imgSrc");
  }
  set imgSrc(value: string | undefined) {
    super.set("imgSrc", value);
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
  get subheadline(): string | undefined {
    return super.get("subheadline");
  }
  set subheadline(value: string | undefined) {
    super.set("subheadline", value);
  }
  get template(): number {
    return super.get("template");
  }
  set template(value: number) {
    super.set("template", value);
  }
  get title(): string | undefined {
    return super.get("title");
  }
  set title(value: string | undefined) {
    super.set("title", value);
  }
}

Parse.Object.registerSubclass("MDZ_SchaufensterExample", MDZ_SchaufensterExample);
