// import React, { useState } from "react";
// import { WidgetStatic } from "@opendash/plugin-monitoring";
// import { useParseQuery } from "parse-hooks";
// import Parse from "parse";
// import { useUrlParam } from "@opendash/core";
// import { Button, Carousel } from "antd";

// interface CustomCarouselProps {
//   images: string[];
// }

// const CustomCarousel: React.FC<CustomCarouselProps> = ({ images }) => {
//   const [zones, setZones] = useState([] as { label: string; value: string }[]);
//   const [lakeId, setLakeId] = useUrlParam(
//     "lakeid",
//     null as string | null,
//     "string"
//   );

//   React.useEffect(() => {
//     init();
//   }, []);

//   const init = async () => {
//     const zones = await new Parse.Query("MIAAS_Geographies").find();
//     setZones(
//       zones.map((zone) => {
//         return { label: zone.get("label"), value: zone.id };
//       })
//     );
//   };

//   //Query Lake Meta Data
//   const lakeQuery = React.useMemo(() => {
//     return new Parse.Query("AD4GD_LakeMetaData");
//   }, []);

//   const { result: lakes, reload, error, loading } = useParseQuery(lakeQuery);

//   console.log({ lakes });

//   const config = React.useMemo(() => {
//     return {
//       markers: [],
//       zones: {
//         type: "zones",
//         districtsFromZones: zones.map((zone) => zone.value),
//         districts: null,
//         districtFromDimension: null,
//       },
//       _history: {
//         aggregation: false,
//       },
//       onEvent: (type: string, event: any) => {
//         console.log({ type, event });
//         console.log(
//           "ID of clicked Features",
//           event.features.map((f: any) => f.properties.objectId)
//         );
//       },
//     };
//   }, [zones]);

//   console.log({ config });

//   return (
//     <>
//       {/* <Carousel arrows>
//         {images.map((image, index) => (
//           <div key={index}>
//             <Image
//               src={require("./map.png")}
//               alt={`Image ${index + 1}`}
//               style={{ maxWidth: "100%", marginBottom: "5%", marginTop: "5%" }}
//             />
//           </div>
//         ))}
//       </Carousel> */}
//     </>
//   );
// };

// export default CustomCarousel;

import React from "react";
import { Carousel, Image } from "antd";
interface CustomCarouselProps {
  images: string[] | undefined;
}
const CustomCarousel: React.FC<CustomCarouselProps> = ({ images }) => (
  <Carousel arrows>
    {" "}
    {images.map((image, index) => (
      <div key={index}>
        {" "}
        <Image
          src={require("./map.png")}
          alt={`Image ${index + 1}`}
          style={{ maxWidth: "100%", marginBottom: "5%", marginTop: "5%" }}
        />{" "}
      </div>
    ))}{" "}
  </Carousel>
);
export default CustomCarousel;
