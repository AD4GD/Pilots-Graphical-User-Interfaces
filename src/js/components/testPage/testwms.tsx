import React, { useEffect, useState } from "react";
import { Button, ConfigProvider, Result, Row, Slider } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";
import axios from "axios";
import "leaflet/dist/leaflet";
import "leaflet/dist/leaflet.css";

const testWMS: React.FC = () => {
  const navigate = useNavigate();

  const [map, setMap] = useState(null);
  const [wmsLayer, setWmsLayer] = useState(null);
  const [time, setTime] = useState("1987-01-01T00:00:00.000Z");
  const [availableTimes, setAvailableTimes] = useState([]);

  const wmsUrl = "https://fairicube.rasdaman.com/rasdaman/ows";
  const layerName = "input_lulc_extended_types";
  const username = "vkryukov";
  const password = "4LNkcsVJ9fXt7uA";

  // init map
  useEffect(() => {
    if (!map) {
      const leafletMap = L.map("map").setView([41.7, 1.7], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        leafletMap
      );

      setMap(leafletMap);
    }
  }, [map]);

  // fetch capabilities and time dimensions for layer
  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await axios.get(
          `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities`,
          {
            auth: {
              username,
              password,
            },
          }
        );

        // parse XML to extract time values for the specific layer
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");

        // find the specific layer by name
        const layerName = "input_lulc_extended_types";
        const layers = xmlDoc.getElementsByTagName("Layer");
        let timeDimensions: any = [];

        for (let i = 0; i < layers.length; i++) {
          const nameNode = layers[i].getElementsByTagName("Name")[0];
          if (nameNode && nameNode.textContent === layerName) {
            const dimensionNode =
              layers[i].getElementsByTagName("Dimension")[0];
            if (
              dimensionNode &&
              dimensionNode.getAttribute("name") === "time"
            ) {
              timeDimensions = dimensionNode.textContent!.trim().split(",");
              break;
            }
          }
        }

        if (timeDimensions.length > 0) {
          setAvailableTimes(timeDimensions);
          setTime(timeDimensions[0]); // set initial time to the first available time
        } else {
          console.error("No time dimension found for the specified layer.");
        }
      } catch (error) {
        console.error("Error fetching WMS capabilities:", error);
      }
    };

    fetchCapabilities();
  }, []);

  // update layers when time changes
  useEffect(() => {
    if (!map) return;

    if (wmsLayer) {
      map.removeLayer(wmsLayer);
    }

    const mapOptions = {
      layers: layerName,
      format: "image/png",
      transparent: true,
      version: "1.3.0",
      time: time,
      crs: L.CRS.EPSG4326,
      styles: "",
      bbox: "40.51223862118809,0.06467085164777338,42.88455540408618,3.362181532390217",
    };

    console.log("WMS Layer:", mapOptions);

    const newWmsLayer = L.tileLayer.wms(wmsUrl, mapOptions).addTo(map);

    // const newWmsLayer = L.tileLayer
    //   .wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
    //     layers: "nexrad-n0r-900913",
    //     format: "image/png",
    //     transparent: true,
    //     attribution: "Weather data © 2012 IEM Nexrad",
    //   })
    //   .addTo(map);

    setWmsLayer(newWmsLayer);

    return () => {
      if (map.hasLayer(newWmsLayer)) {
        map.removeLayer(newWmsLayer);
      }
    };
  }, [time, map, wmsUrl, layerName]);

  const onTimeChange = (value: any) => {
    setTime(availableTimes[value]);
  };

  return (
    <div style={{ height: "800px", width: "800px", margin: "0 auto" }}>
      <div id="map" style={{ height: "500px", width: "100%" }}></div>
      {availableTimes.length > 0 && (
        <Slider
          min={0}
          max={availableTimes.length - 1}
          step={1}
          onChange={onTimeChange}
          marks={availableTimes.reduce((acc: any, time: any, index: any) => {
            acc[index] = time.split("T")[0];
            return acc;
          }, {})}
        />
      )}
    </div>
  );
};

export default testWMS;

// import React, { useEffect } from 'react';
// import L from 'leaflet';

// // Define the URL of the image to be used as a layer
// const imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg'; // Replace with your image URL

// // Define the bounds for the image layer
// const bounds = [[51.49, -0.08], [51.5, 0.06]]; // Adjust these coordinates based on your image

// const MapWithImageLayer = () => {
//   useEffect(() => {
//     // Initialize the map
//     const map = L.map('map', {
//       center: [51.505, -0.09],
//       zoom: 13,
//     });

//     // Add a tile layer
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//     }).addTo(map);

//     // Add an image overlay
//     L.imageOverlay(imageUrl, bounds).addTo(map);

//     // Clean up on unmount
//     return () => {
//       map.remove();
//     };
//   }, []);

//   return <div id="map" style={{ height: '100vh', width: '100%' }} />;
// };

// export default MapWithImageLayer;
