import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { Slider, Typography, Spin, Alert } from "antd";
import "antd/dist/reset.css";

const { Title } = Typography;

// Define available time options as per the XML
const availableTimes = [
  "1987-01-01T00:00:00.000Z",
  "1992-01-01T00:00:00.000Z",
  "1997-01-01T00:00:00.000Z",
  "2002-01-01T00:00:00.000Z",
  "2007-01-01T00:00:00.000Z",
  "2012-01-01T00:00:00.000Z",
  "2017-01-01T00:00:00.000Z",
  "2022-01-01T00:00:00.000Z",
];

const WMSMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(0); // Default to the first time

  const username = "vkryukov";
  const password = "4LNkcsVJ9fXt7uA";

  // Helper function to encode credentials for Basic Auth
  const encodeCredentials = (username: string, password: string) => {
    return btoa(`${username}:${password}`);
  };

  useEffect(() => {
    if (mapRef.current) {
      const newMap = L.map(mapRef.current).setView([41.7, 1.7], 10); // Set a default view
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        newMap
      );
      setMap(newMap);
    }
  }, []);

  const fetchWMSImage = async (time: string) => {
    try {
      const wmsUrl = "https://fairicube.rasdaman.com/rasdaman/ows";
      const params = {
        service: "WMS",
        version: "1.3.0",
        request: "GetMap",
        layers: "input_lulc_extended_types",
        bbox: "40.51223862118809,0.06467085164777338,42.88455540408618,3.362181532390217",
        time,
        width: "800",
        height: "600",
        crs: "EPSG:4326",
        format: "image/png",
        transparent: "true",
        styles: "",
      };
      // Construct the WMS request URL
      const url = `${wmsUrl}?${new URLSearchParams(params)}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${encodeCredentials(username, password)}`,
        },
        responseType: "arraybuffer",
      });

      // Convert the response data to a blob and create a URL
      const blob = new Blob([response.data], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);

      // Set image URL and bounds
      setImageSrc(imageUrl);
      setBounds(
        L.latLngBounds(
          L.latLng(40.5122386211880907512, 0.06467085164777338),
          L.latLng(42.88455540408618, 3.3621815323902170776)
        )
      );
    } catch (err) {
      setError(`Error fetching WMS image: ${err}`);
    }
  };

  useEffect(() => {
    if (map && availableTimes[selectedTime]) {
      fetchWMSImage(availableTimes[selectedTime]);
    }
  }, [map, selectedTime]);

  useEffect(() => {
    if (map && imageSrc && bounds) {
      L.imageOverlay(imageSrc, bounds).addTo(map);
      map.fitBounds(bounds);
    }
  }, [map, imageSrc, bounds]);

  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      <div
        id="map"
        style={{
          height: "600px", // Reduced height
          width: "50%", // Full width
          margin: "0 auto",
          marginBottom: "16px", // Margin below the map
        }}
        ref={mapRef}
      ></div>
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <Slider
          min={0}
          max={availableTimes.length - 1}
          value={selectedTime}
          onChange={(value) => setSelectedTime(value)}
          marks={availableTimes.reduce((acc, time, index) => {
            const date = new Date(time).getFullYear();
            acc[index] = date;
            return acc;
          }, {} as Record<number, string>)}
          style={{ width: "50%", margin: "0 auto", marginBottom: "3rem" }}
        />
        <p>
          Selected Time: {new Date(availableTimes[selectedTime]).getFullYear()}
        </p>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default WMSMap;
