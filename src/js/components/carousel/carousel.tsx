import React from "react";
import { Carousel, Typography } from "antd";
import Minimap from "../minimap/minimap";

interface MapItem {
  layerUrls: string[];
  title: string;
  legend?: string | Parse.File | null;
}

interface CustomCarouselProps {
  maps: MapItem[];
  bbox: string;
  updateBbox: (newBbox: string) => void;
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({
  maps,
  bbox,
  updateBbox,
}) => {
  const getLegendUrl = (legend?: string | Parse.File | null): string | null => {
    if (!legend) return null;
    return typeof legend === "string" ? legend : legend.url();
  };

  return (
    <Carousel arrows>
      {!maps.length ? (
        <div>No maps available</div>
      ) : (
        maps.map((map, index) => (
          <div key={index}>
            <Minimap
              layerUrls={map.layerUrls}
              layerLegendUrl={getLegendUrl(map.legend)}
              bbox={bbox}
              updateBbox={updateBbox}
            />
            <Typography.Title level={5} style={{ fontWeight: "bold" }}>
              {map.title}
            </Typography.Title>
          </div>
        ))
      )}
    </Carousel>
  );
};

export default CustomCarousel;
