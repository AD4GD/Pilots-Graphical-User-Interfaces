import Parse from "parse";

type OD3_Dashboard = Parse.Object;

export interface OD3_Monitoring_SlideshowAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  dashboards: Parse.Relation<OD3_Monitoring_Slideshow, OD3_Dashboard>;
  interval: number;
  name: string;
}

export class OD3_Monitoring_Slideshow extends Parse.Object<OD3_Monitoring_SlideshowAttributes> {
  static className: string = "OD3_Monitoring_Slideshow";

  constructor(data?: Partial<OD3_Monitoring_SlideshowAttributes>) {
    super("OD3_Monitoring_Slideshow", data as OD3_Monitoring_SlideshowAttributes);
  }

  get dashboards(): Parse.Relation<OD3_Monitoring_Slideshow, OD3_Dashboard> {
    return super.relation("dashboards");
  }
  get interval(): number {
    return super.get("interval");
  }
  set interval(value: number) {
    super.set("interval", value);
  }
  get name(): string {
    return super.get("name");
  }
  set name(value: string) {
    super.set("name", value);
  }
}

Parse.Object.registerSubclass("OD3_Monitoring_Slideshow", OD3_Monitoring_Slideshow);
