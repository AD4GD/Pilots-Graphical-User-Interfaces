import React, { FC, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import debounce from "lodash.debounce";
import { Button, Tooltip } from "antd";
import Parse from "parse";

interface MinimapProps {
  layerUrls: string[];
  bbox: string;
  updateBbox: (newBbox: string) => void;
}

const Minimap: FC<MinimapProps> = ({ layerUrls, bbox, updateBbox }) => {
  const [legendUrl, setLegendUrl] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRefs = useRef<L.ImageOverlay[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const appendBboxToUrl = (url: string, bbox: string) => {
    const urlObj = new URL(url);
    if (urlObj.searchParams.get("bbox") !== bbox) {
      urlObj.searchParams.set("bbox", bbox);
    }
    return urlObj.toString();
  };

  useEffect(() => {
    // Fetch the legend image URL from Parse Server
    const fetchLegendUrl = async () => {
      const LegendClass = Parse.Object.extend("AD4GD_Lake_Layers");
      const query = new Parse.Query(LegendClass);
      query.ascending("createdAt");
      const result = await query.first();

      if (result) {
        const imageUrl = result.get("legendUrl");
        setLegendUrl(imageUrl._url);
        console.log(imageUrl);
      } else {
        console.error("No legend URL found.");
      }
    };

    fetchLegendUrl().catch((error) =>
      console.error("Error fetching legend URL:", error)
    );
  }, []);

  useEffect(() => {
    if (mapContainerRef.current) {
      const bboxValues = bbox.split(",").map(Number);
      const maxBounds = L.latLngBounds(
        L.latLng(bboxValues[0], bboxValues[1]),
        L.latLng(bboxValues[2], bboxValues[3])
      );

      if (!mapRef.current) {
        const minimap = L.map(mapContainerRef.current, {
          center: maxBounds.getCenter(),
          zoom: 16,
          minZoom: 13,
          maxZoom: 20,
          maxBounds,
          worldCopyJump: true,
        });

        L.tileLayer(
          "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        ).addTo(minimap);

        mapRef.current = minimap;
      }

      const minimap = mapRef.current;

      minimap?.setMaxBounds(maxBounds);

      const loadLayers = debounce(() => {
        if (minimap) {
          const bounds = minimap.getBounds();
          const newBbox = [
            bounds.getSouth(),
            bounds.getWest(),
            bounds.getNorth(),
            bounds.getEast(),
          ].join(",");

          updateBbox(newBbox);

          layerRefs.current.forEach((layer) => {
            layer.remove();
          });
          layerRefs.current = [];

          layerUrls.forEach((url) => {
            const minimapLayer = L.imageOverlay(
              appendBboxToUrl(url, newBbox),
              bounds
            );
            minimapLayer.addTo(minimap);
            layerRefs.current.push(minimapLayer);
          });
        }
      }, 300);

      loadLayers();
      minimap.on("zoomend moveend", loadLayers);

      return () => {
        minimap.off("zoomend moveend", loadLayers);
      };
    }
  }, [layerUrls, bbox, updateBbox]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainerRef}
        style={{
          height: "400px",
          width: "100%",
        }}
      ></div>

      <Tooltip
        title={
          legendUrl ? (
            <img
              src={legendUrl}
              alt="Legend"
              style={{
                width: "300px",
                height: "auto",
                display: "block",
              }}
            />
          ) : (
            "Loading legend..."
          )
        }
        placement="right"
        trigger="click"
      >
        <Button
          type="primary"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          i
        </Button>
      </Tooltip>
    </div>
  );
};

export default Minimap;
