import React from "react";
import { Carousel } from "antd";
import { Typography } from "antd";
import Minimap from "../minimap/minimap";

interface MapItem {
  layerUrls: string[];
  title: string;
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
}) => (
  <Carousel arrows>
    {!maps.length ? (
      <div>No maps available</div>
    ) : (
      maps.map((map, index) => (
        <div key={index}>
          <Minimap
            layerUrls={map.layerUrls}
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

export default CustomCarousel;
