import React from "react";
import { Carousel, Image } from "antd";

interface CustomCarouselProps {
  images: string[];
}

const CustomCarousel: React.FC<CustomCarouselProps> = ({ images }) => (
  <Carousel arrows>
    {images.map((image, index) => (
      <div key={index}>
        <Image
          src={require("./map.png")}
          alt={`Image ${index + 1}`}
          style={{ maxWidth: "100%", marginBottom: "5%", marginTop: "5%" }}
        />
      </div>
    ))}
  </Carousel>
);

export default CustomCarousel;
