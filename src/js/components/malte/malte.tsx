import React, { FC, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-boundary-canvas";
import berlinBoundary from "./berlinBoundary.json";
import debounce from "lodash.debounce"; // Import debounce function

const Malte: FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const layer0Ref = useRef<L.ImageOverlay | null>(null);
  const layer1Ref = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    // Initialize the map centered around Berlin
    const initializedMap = L.map("map", {
      center: [52.5, 13.4],
      zoom: 16,
      minZoom: 14,
      maxZoom: 18,
      maxBounds: L.latLngBounds(
        L.latLng(52.546884256449836, 13.32476746097947),
        L.latLng(52.541716537452196, 13.334101601645372)
      ),
    });

    // Add restricted boundary canvas
    L.TileLayer.boundaryCanvas(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      {
        boundary: berlinBoundary,
      }
    ).addTo(initializedMap);

    mapRef.current = initializedMap;

    const loadLayers = debounce(() => {
      if (initializedMap) {
        const bounds = initializedMap.getBounds();
        const bbox = [
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast(),
        ].join(",");

        // WMS URLs with dynamic bbox
        const layer0Url = `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_fb_btwert?service=wms&request=getmap&version=1.3.0&layers=0&styles=&crs=EPSG:4326&bbox=${bbox}&width=1000&height=1000&format=image/png&transparent=true`;
        const layer1Url = `https://fbinter.stadt-berlin.de/fb/wms/senstadt/k_fb_btwert?service=wms&request=getmap&version=1.3.0&layers=1&styles=&crs=EPSG:4326&bbox=${bbox}&width=1000&height=1000&format=image/png&transparent=true`;

        // Remove existing layers if they exist
        if (layer0Ref.current) {
          layer0Ref.current.remove();
        }

        if (layer1Ref.current) {
          layer1Ref.current.remove();
        }

        // Add new layer0
        const newLayer0 = L.imageOverlay(layer0Url, bounds, { opacity: 1 });
        newLayer0.addTo(initializedMap);
        layer0Ref.current = newLayer0;

        // Add new layer1
        const newLayer1 = L.imageOverlay(layer1Url, bounds, { opacity: 1 });
        newLayer1.addTo(initializedMap);
        layer1Ref.current = newLayer1;
      }
    }, 300); // Debounce to prevent rapid requests

    // Initial load
    loadLayers();

    // Update layers on zoom/move
    initializedMap.on("zoomend moveend", loadLayers);

    return () => {
      initializedMap.off("zoomend moveend", loadLayers);
      initializedMap.remove();
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        id="map"
        style={{ height: "500px", width: "500px", margin: "0 auto" }}
      ></div>
    </div>
  );
};

export default Malte;
