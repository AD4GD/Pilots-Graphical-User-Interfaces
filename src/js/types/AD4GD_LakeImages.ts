import Parse from "parse";

type AD4GD_LakeMetaData = Parse.Object;

export interface AD4GD_LakeImagesAttributes {
  id: string;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;

  description: string;
  image: Parse.File;
  lake: AD4GD_LakeMetaData;
}

export class AD4GD_LakeImages extends Parse.Object<AD4GD_LakeImagesAttributes> {
  static className: string = "AD4GD_LakeImages";

  constructor(data?: Partial<AD4GD_LakeImagesAttributes>) {
    super("AD4GD_LakeImages", data as AD4GD_LakeImagesAttributes);
  }

  get description(): string {
    return super.get("description");
  }
  set description(value: string) {
    super.set("description", value);
  }
  get image(): Parse.File {
    return super.get("image");
  }
  set image(value: Parse.File) {
    super.set("image", value);
  }
  get lake(): AD4GD_LakeMetaData {
    return super.get("lake");
  }
  set lake(value: AD4GD_LakeMetaData) {
    super.set("lake", value);
  }
}

Parse.Object.registerSubclass("AD4GD_LakeImages", AD4GD_LakeImages);
