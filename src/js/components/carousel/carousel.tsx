import React, { useState } from "react";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useParseQuery } from "parse-hooks";
import Parse from "parse";
import { useUrlParam } from "@opendash/core";
import { Button } from "antd";

interface CustomCarouselProps {
  images: string[];
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ images }) => {
  const [zones, setZones] = useState([] as { label: string; value: string }[]);
  const [lakeId, setLakeId] = useUrlParam(
    "lakeid",
    null as string | null,
    "string"
  );
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
      {!lakeId && (
        <>
          <WidgetStatic
            style={{ height: "100vh" }}
            type="kpi-map"
            config={config}
          ></WidgetStatic>
          <Button
            onClick={() => {
              setLakeId("adljbngoqe");
            }}
          >
            {" "}
          </Button>
        </>
      )}
      {lakeId && <h1>Details of lake with id {lakeId}</h1>}

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
