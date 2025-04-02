import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Row, Select, Slider, Input, Button, Checkbox, Radio } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import geoblaze from "geoblaze";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import colorRamp from "./colorRamp.json";
import { Spin } from "antd";

const { Option } = Select;

const epsg32631 = "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

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

const propertyOptions = [
  "Aquatic",
  "Forest",
  "HerbaceousCrops",
  "WoodyCrops",
  "Shrublands",
];

const geoToPixel = (georaster, easting, northing) => {
  const { xmin, ymin, xmax, ymax, width, height } = georaster;

  const xResolution = (xmax - xmin) / width;
  const yResolution = (ymax - ymin) / height;

  const col = Math.floor((easting - xmin) / xResolution);
  const row = Math.floor((ymax - northing) / yResolution); // Notice ymax - northing!

  if (col >= 0 && col < width && row >= 0 && row < height) {
    return { col, row };
  } else {
    console.log("Coordinates are out of bounds.");
    return null;
  }
};

const BioConn: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState("Forest");
  const [time, setTime] = useState(availableTimes[6]);
  const [xCoord, setXCoord] = useState<string | null>(null);
  const [yCoord, setYCoord] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [speciesOption, setSpeciesOption] = useState<"all" | "specific">("all");
  const [selectedSpecies, setSelectedSpecies] = useState("Mustela putaris");

  // State for layers radio button
  const [layerOption, setLayerOption] = useState<"connectivity" | "muscsc">(
    "connectivity"
  );

  // State for checkboxes
  const [checkboxOptions, setCheckboxOptions] = useState({
    satellite: false,
    roads: false,
    rivers: false,
    waterBodies: false,
    protectedAreas: false,
  });

  // Handle species radio button change
  const handleSpeciesChange = (e: any) => {
    setSpeciesOption(e.target.value);
  };

  // Handle layers radio button change
  const handleLayerChange = (e: any) => {
    setLayerOption(e.target.value);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (option: string) => {
    setCheckboxOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      console.log("Initializing map...");
      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }
  }, []);

  const updateMap = (rasterLayer: any, georaster: any) => {
    if (leafletMap.current && rasterLayer) {
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof GeoRasterLayer) {
          leafletMap.current?.removeLayer(layer);
        }
      });

      rasterLayer.addTo(leafletMap.current);

      rasterLayer.on("load", () => {
        setLoading(false); // Set loading to false only after layer is loaded
      });

      const layerBounds = rasterLayer.getBounds();
      leafletMap.current.fitBounds(layerBounds);

      // L.rectangle(layerBounds, {
      //   color: "#ff0000",
      //   fillOpacity: 0,
      //   weight: 1,
      // }).addTo(leafletMap.current);

      leafletMap.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Convert WGS84 (Lat, Lng) to EPSG:32631 (Easting, Northing)
        const [easting, northing] = proj4(wgs84, epsg32631, [lng, lat]);

        const pixelCoords = geoToPixel(georaster, easting, northing);

        // Get value using geoblaze.identify with converted coordinates
        const values = await geoblaze.identify(georaster, [easting, northing]);

        console.log(
          `Pixel Value read by clicking at [${easting}, ${northing}]:`,
          values
        );

        if (pixelCoords) {
          const { col, row } = pixelCoords;
          console.log(
            `Clicked at [${easting}, ${northing}] which corresponds to pixel [${row}, ${col}]`
          );

          const rasterValue = georaster.values[0][row][col];
          console.log(
            `Raster Value at georaster.values[0][${row}][${col}]: ${rasterValue}`
          );
        }
      });
    }
  };

  const fetchImage = async () => {
    setLoading(true);
    setError("");
    try {
      const url =
        layerOption === "connectivity"
          ? `http://localhost:3000/connectivity?time=${time}&properties=${properties}`
          : `http://localhost:3000/mucsc?time=${time}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      if (
        blob.type !== "image/tiff" &&
        blob.type !== "application/octet-stream"
      ) {
        throw new Error("Invalid file format received. Expected a GeoTIFF.");
      }

      const georaster = await geoblaze.parse(arrayBuffer);
      const rasterLayer = await createRaster(georaster, layerOption);

      updateMap(rasterLayer, georaster);
    } catch (err) {
      console.error("Error fetching the image:", err);
      setError("Error fetching the image.");
      setLoading(false);
    }
  };

  // Function to handle coordinate input and move the map
  const handleGoToCoordinates = () => {
    if (!xCoord || !yCoord || !leafletMap.current) return;

    const easting = parseFloat(xCoord);
    const northing = parseFloat(yCoord);

    if (isNaN(easting)) return;
    if (isNaN(northing)) return;

    try {
      // Convert UTM to WGS84
      const [lng, lat] = proj4(epsg32631, wgs84, [easting, northing]);

      // Check if coordinates are valid
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Invalid coordinates");
      }

      leafletMap.current.setView([lat, lng], 15);
    } catch (error) {
      console.error("Error converting coordinates:", error);
      setError("Invalid coordinates entered");
    }
  };

  useEffect(() => {
    fetchImage();
  }, [properties, time, layerOption]);

  const interpolateColor = (
    value: number,
    layerOption: "connectivity" | "muscsc"
  ): string => {
    if (layerOption === "muscsc") {
      // MUSCSC color mapping
      switch (value) {
        case 0:
          return "rgba(0, 0, 0, 0)"; // NODATA (transparent)
        case 1:
          return "rgb(153, 247, 245)"; // Aquatic
        case 2:
          return "rgb(164, 0, 0)"; // Built area
        case 3:
          return "rgb(255, 255, 140)"; // Herbaceous cropland
        case 4:
          return "rgb(255, 200, 145)"; // Woody cropland
        case 5:
          return "rgb(145, 134, 0)"; // Shrubland and grassland
        case 6:
          return "rgb(0, 132, 0)"; // Forestland
        case 7:
          return "rgb(184, 201, 189)"; // Bare/sparse vegetation
        default:
          return "rgba(0, 0, 0, 0)"; // Default to transparent for unknown values
      }
    } else {
      // Connectivity color mapping using colorRamp.json
      if (value < 0) return "rgba(0, 0, 255, 0)"; // Transparent for negative values

      // Normalize the value to a range of 0-255
      const normalizedValue = Math.floor((value / 2.5) * 255);

      // Clamp the value to ensure it stays within 0-255
      const clampedValue = Math.min(Math.max(normalizedValue, 0), 255);

      // Get the corresponding color from the colorRamp.json
      const color = colorRamp[clampedValue.toString()];

      // Return the color in RGB format
      return color || "rgba(0, 0, 0, 0)"; // Default to transparent if color is not found
    }
  };

  const createRaster = async (
    georaster: any,
    layerOption: "connectivity" | "muscsc"
  ) => {
    return new GeoRasterLayer({
      georaster: georaster,
      opacity: 0.7,
      //@ts-ignore
      pixelValuesToColorFn: (values: number[]) => {
        const value = values[0];

        if (value === undefined || value === null || isNaN(value)) {
          return null; // Transparent for NODATA
        }

        return interpolateColor(value, layerOption);
      },
      resolution: 512,
    });
  };

  return (
    <>
      {/* Header Row - Do not touch */}
      <Row style={{ width: "100%", height: "100px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-bioconn-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      {/* Content Row */}
      <Row style={{ width: "100%", display: "flex" }}>
        <div style={{ width: "30%", padding: "16px" }}>
          {/* Map Settings Heading */}
          <h2>Map Settings</h2>

          {/* Species Section */}
          <div style={{ marginBottom: "24px" }}>
            <h3>Species</h3>
            <Radio.Group onChange={handleSpeciesChange} value={speciesOption}>
              <Radio
                value="all"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Show aggregated connectivity for all species
              </Radio>
              <Radio
                value="specific"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Show only specific species
              </Radio>
            </Radio.Group>

            <Select
              defaultValue="Mustela putaris"
              style={{ width: "100%", marginTop: "8px" }}
              onChange={(value) => setSelectedSpecies(value)}
              disabled={speciesOption !== "specific"}
            >
              <Option value="Mustela putaris">Mustela putaris</Option>
            </Select>
          </div>

          {/* Layers Section */}
          <div style={{ marginBottom: "24px" }}>
            <h3>Layers</h3>
            <Radio.Group onChange={handleLayerChange} value={layerOption}>
              <Radio
                value="muscsc"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Catalan Land Use Land Cover (MUCSC)
              </Radio>
              <Radio
                value="connectivity"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Connectivity Index
              </Radio>
            </Radio.Group>

            <Select
              defaultValue={properties}
              style={{ width: "100%" }}
              onChange={setProperties}
              disabled={layerOption !== "connectivity"}
            >
              {propertyOptions.map((property) => (
                <Option key={property} value={property}>
                  {property}
                </Option>
              ))}
            </Select>
          </div>

          {/* Checkboxes Section */}
          <div style={{ marginBottom: "24px" }}>
            <Checkbox
              checked={checkboxOptions.satellite}
              onChange={() => handleCheckboxChange("satellite")}
            >
              Satellite image
            </Checkbox>
            <br />
            <Checkbox
              checked={checkboxOptions.roads}
              onChange={() => handleCheckboxChange("roads")}
            >
              Roads and Railways
            </Checkbox>
            <br />
            <Checkbox
              checked={checkboxOptions.rivers}
              onChange={() => handleCheckboxChange("rivers")}
            >
              Rivers
            </Checkbox>
            <br />
            <Checkbox
              checked={checkboxOptions.waterBodies}
              onChange={() => handleCheckboxChange("waterBodies")}
            >
              Water bodies
            </Checkbox>
            <br />
            <Checkbox
              checked={checkboxOptions.protectedAreas}
              onChange={() => handleCheckboxChange("protectedAreas")}
            >
              Protected Areas
            </Checkbox>
          </div>

          {/* Buttons Section */}
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ width: "100%", marginBottom: "8px" }}
              onClick={() => console.log(loading)}
            >
              Create Scenario
            </Button>
            <Button style={{ width: "100%" }}>Export Data</Button>
          </div>
        </div>

        {/* Right Column (70% width) */}
        <div style={{ width: "70%", padding: "16px" }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="Easting (X)"
              value={xCoord}
              onChange={(e) => setXCoord(e.target.value)}
              style={{ width: "120px" }}
            />
            <Input
              placeholder="Northing (Y)"
              value={yCoord}
              onChange={(e) => setYCoord(e.target.value)}
              style={{ width: "120px" }}
            />
            <Button
              type="primary"
              onClick={handleGoToCoordinates}
              style={{ width: "100px" }}
            >
              Go to
            </Button>
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "65%", // Centered on the map area (70% width column)
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <Spin size="large" />
              </div>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>

          <div
            id="map-container"
            style={{
              position: "relative",
              height: "600px",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
          </div>

          {/* Slider under the map */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Slider
              min={0}
              max={availableTimes.length - 1}
              defaultValue={6}
              onChange={(value) => setTime(availableTimes[value])}
              marks={{
                0: "1987",
                1: "1992",
                2: "1997",
                3: "2002",
                4: "2007",
                5: "2012",
                6: "2017",
                7: "2022",
              }}
              step={1}
              style={{ width: "90%" }}
            />
          </div>
        </div>
      </Row>
    </>
  );
};

export default BioConn;
