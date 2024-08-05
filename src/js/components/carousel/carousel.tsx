import React, { useState } from "react";
import { Carousel, Image, Select } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";
interface CustomCarouselProps {
  images: string[];
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ images }) => {
  const [zones, setZones] = React.useState(
    [] as { label: string; value: string }[]
  );
  const [cZone, setCZone] = React.useState<string[]>([]);
  React.useEffect(() => {
    init();
  }, []);
  const init = async () => {
    const zones = await new Parse.Query("MIAAS_Geographies").find();
    setZones(
      zones.map((zone) => {
        return { label: zone.get("label"), value: zone.id };
      })
    );
  };

  //Query Lake Meta Data
  const lakeQuery = React.useMemo(() => {
    return new Parse.Query("AD4GD_LakeMetaData");
  }, []);
  const { result: lakes, reload, error, loading } = useParseQuery(lakeQuery);
  console.log({ lakes });
  const config = React.useMemo(() => {
    return {
      markers: [],
      zones: {
        type: "zones",
        districtsFromZones: zones.map((zone) => zone.value),
        districts: null,
        districtFromDimension: null,
      },
      _history: {
        aggregation: false,
      },
      onEvent: (type: string, event: any) => {
        console.log({ type, event });
        console.log(
          "ID of clicked Features",
          event.features.map((f: any) => f.properties.objectId)
        );
      },
    };
  }, [zones]);
  console.log({ config });
  return (
    <>
      {/* <Select
        style={{ width: "100%" }}
        options={zones}
        value={cZone}
        onChange={(zone) => {
          console.log({ zone });
          if (zone) {
            setCZone(zone);
          }
        }}
      ></Select> */}
      <WidgetStatic
        style={{ height: "100vh" }}
        type="kpi-map"
        config={config}
      ></WidgetStatic>
      {/* <Carousel arrows>
        {images.map((image, index) => (
          <div key={index}>
            <Image
              src={require("./map.png")}
              alt={`Image ${index + 1}`}
              style={{ maxWidth: "100%", marginBottom: "5%", marginTop: "5%" }}
            />
          </div>
        ))}
      </Carousel> */}
    </>
  );
};

export default CustomCarousel;
