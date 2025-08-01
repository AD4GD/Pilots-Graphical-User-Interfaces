import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Row,
  Select,
  Slider,
  Input,
  Button,
  Checkbox,
  Radio,
  ConfigProvider,
  Collapse,
  Divider,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import geoblaze from "geoblaze";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import colorRamp from "./colorRamp.json";
import { Spin } from "antd";
import { useNavigate } from "@opendash/router";
import Parse from "parse";
import cataloniaBounds from "./cataloniaBounds.json";

// Type definitions
interface GbifSpecies {
  key: number;
  scientificName: string;
  commonName?: string;
}

interface GbifOccurrence {
  decimalLatitude?: number;
  decimalLongitude?: number;
  key: number;
  scientificName?: string;
  vernacularName?: string;
  eventDate?: string;
  recordedBy?: string;
  institutionCode?: string;
  collectionCode?: string;
  catalogNumber?: string;
  basisOfRecord?: string;
  occurrenceStatus?: string;
  country?: string;
  stateProvince?: string;
  locality?: string;
}

interface GeoRaster {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  width: number;
  height: number;
}

interface CheckboxOptions {
  satellite: boolean;
  roads: boolean;
  protectedAreas: boolean;
  natura2000: boolean;
  enpe: boolean;
  pein: boolean;
  aquaticProtected: boolean;
  riversWaterBodies: boolean;
  cadastral: boolean;
}

const { Option } = Select;
const { Panel } = Collapse;

const epsg32631 = "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs";
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

const CATALONIA_BBOX = cataloniaBounds.objects.municipis.bbox;
const CATALONIA_GEO = cataloniaBounds.objects.municipis.geometries;

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

const geoToPixel = (
  georaster: GeoRaster,
  easting: number,
  northing: number
) => {
  const { xmin, ymin, xmax, ymax, width, height } = georaster;

  const xResolution = (xmax - xmin) / width;
  const yResolution = (ymax - ymin) / height;

  const col = Math.floor((easting - xmin) / xResolution);
  const row = Math.floor((ymax - northing) / yResolution);

  if (col >= 0 && col < width && row >= 0 && row < height) {
    return { col, row };
  } else {
    console.log("Coordinates are out of bounds.");
    return null;
  }
};

// Function to check if a point is within Catalonia using bounding box
const isPointInCatalonia = (lat: number, lng: number): boolean => {
  // Use a simple bounding box check
  return (
    lng >= CATALONIA_BBOX[0] &&
    lng <= CATALONIA_BBOX[2] &&
    lat >= CATALONIA_BBOX[1] &&
    lat <= CATALONIA_BBOX[3]
  );
};

const BioConn: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState("Forest");
  const [time, setTime] = useState(availableTimes[7]);
  const [xCoord, setXCoord] = useState<string | null>(null);
  const [yCoord, setYCoord] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const [speciesOption, setSpeciesOption] = useState<"all" | "specific">("all");
  const [gbifQuery, setGbifQuery] = useState("");
  const [gbifSuggestions, setGbifSuggestions] = useState<GbifSpecies[]>([]);
  const [selectedTaxonKey, setSelectedTaxonKey] = useState<number | null>(null);
  const [occurrenceData, setOccurrenceData] = useState<GbifOccurrence[]>([]);
  const [hasLoadedAnyLayer, setHasLoadedAnyLayer] = useState(false);
  const [showingAllSpecies, setShowingAllSpecies] = useState(true);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(false);

  const searchGbifSpecies = async (query: string) => {
    try {
      const response = await fetch(
        `https://api.gbif.org/v1/species/suggest?q=${query}&limit=5`
      );
      const data = await response.json();
      setGbifSuggestions(data);
    } catch (error) {
      console.error("GBIF species search error:", error);
    }
  };

  const fetchAllSpeciesOccurrences = async () => {
    // This function would load aggregated connectivity data for all species
    // Implementation depends on your data source
    console.log("Loading aggregated species data...");
    setLoading(true);
    try {
      // Add your implementation here
      setOccurrenceData([]);
    } catch (error) {
      console.error("Error loading aggregated species data:", error);
      setError("Failed to load aggregated species data");
    } finally {
      setLoading(false);
    }
  };

  const fetchGbifOccurrences = async () => {
    if (!selectedTaxonKey) return;

    setLoading(true);
    try {
      // Use the bounding box for GBIF API query (simpler and more reliable)
      // The precise filtering will happen client-side
      const wkt = `POLYGON((
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[1]},
        ${CATALONIA_BBOX[2]} ${CATALONIA_BBOX[1]},
        ${CATALONIA_BBOX[2]} ${CATALONIA_BBOX[3]},
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[3]},
        ${CATALONIA_BBOX[0]} ${CATALONIA_BBOX[1]}
      ))`;

      const response = await fetch(
        `https://api.gbif.org/v1/occurrence/search?` +
          `taxonKey=${selectedTaxonKey}&` +
          `geometry=${wkt}&` +
          `limit=300`
      );

      const data = await response.json();

      // Filter occurrences to only include those within Catalonia borders
      const filteredOccurrences = data.results.filter((occ: GbifOccurrence) => {
        if (!occ.decimalLatitude || !occ.decimalLongitude) return false;
        return isPointInCatalonia(occ.decimalLatitude, occ.decimalLongitude);
      });

      // Store the filtered occurrences
      setOccurrenceData(filteredOccurrences);
      plotOccurrences(filteredOccurrences);

      console.log(
        `Loaded ${filteredOccurrences.length} occurrences within Catalonia from ${data.results.length} total for ${gbifQuery}`
      );

      // Don't automatically zoom to Catalonia bounds - maintain user's current view
    } catch (error) {
      console.error("GBIF occurrence fetch error:", error);
      setError("Failed to load species data");
    } finally {
      setLoading(false);
    }
  };
  const plotOccurrences = (occurrences: GbifOccurrence[]) => {
    // Clear previous occurrences
    if (!leafletMap.current) return;

    leafletMap.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        leafletMap.current!.removeLayer(layer);
      }
    });

    console.log(`Plotting ${occurrences.length} occurrences within Catalonia`);

    // Plot all occurrences (they are already filtered to be within Catalonia)
    occurrences.forEach((occ: GbifOccurrence) => {
      if (occ.decimalLatitude && occ.decimalLongitude && leafletMap.current) {
        const marker = L.circleMarker(
          [occ.decimalLatitude, occ.decimalLongitude],
          {
            radius: 6,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          }
        );

        // Create comprehensive popup content with occurrence details
        let popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 350px; line-height: 1.2;">
            <h4 style="margin: 0 0 8px 0; color: #1890ff; border-bottom: 1px solid #ddd; padding-bottom: 4px;">
              ${occ.scientificName || gbifQuery || "Species Occurrence"}
            </h4>
        `;

        // Add vernacular name if available
        if (occ.vernacularName) {
          popupContent += `<p style="margin: 2px 0; font-style: italic; color: #666; font-size: 13px;">
            Common name: ${occ.vernacularName}
          </p>`;
        }

        // Location information
        popupContent += `
          <div style="margin: 6px 0;">
            <strong>📍 Location:</strong><br>
            <span style="font-size: 11px;">
              Lat: ${occ.decimalLatitude.toFixed(
                6
              )}, Lng: ${occ.decimalLongitude.toFixed(6)}
            </span>
        `;

        if (occ.locality) {
          popupContent += `<br><span style="font-size: 11px;">${occ.locality}</span>`;
        }
        if (occ.stateProvince) {
          popupContent += `<br><span style="font-size: 11px;">${occ.stateProvince}</span>`;
        }
        if (occ.country) {
          popupContent += `<br><span style="font-size: 11px;">${occ.country}</span>`;
        }
        popupContent += `</div>`;

        // Record information
        if (occ.eventDate) {
          const date = new Date(occ.eventDate).toLocaleDateString();
          popupContent += `<p style="margin: 2px 0;"><strong>📅 Date:</strong> ${date}</p>`;
        }

        if (occ.basisOfRecord) {
          popupContent += `<p style="margin: 2px 0;"><strong>📋 Basis:</strong> ${occ.basisOfRecord}</p>`;
        }

        if (occ.recordedBy) {
          popupContent += `<p style="margin: 2px 0;"><strong>👤 Recorded by:</strong> ${occ.recordedBy}</p>`;
        }

        // Institution information
        if (occ.institutionCode || occ.collectionCode) {
          popupContent += `<div style="margin: 6px 0; font-size: 11px; color: #666;">`;
          if (occ.institutionCode) {
            popupContent += `<strong>Institution:</strong> ${occ.institutionCode}<br>`;
          }
          if (occ.collectionCode) {
            popupContent += `<strong>Collection:</strong> ${occ.collectionCode}<br>`;
          }
          if (occ.catalogNumber) {
            popupContent += `<strong>Catalog #:</strong> ${occ.catalogNumber}`;
          }
          popupContent += `</div>`;
        }

        // GBIF link
        popupContent += `
          <div style="margin-top: 8px; text-align: center; border-top: 1px solid #ddd; padding-top: 6px;">
            <a href="https://www.gbif.org/occurrence/${occ.key}" target="_blank" 
               style="color: #1890ff; text-decoration: none; font-weight: bold; font-size: 12px;">
              🔗 View full record on GBIF
            </a>
          </div>
        </div>`;

        marker.bindPopup(popupContent, {
          maxWidth: 400,
          closeButton: true,
          autoPan: true,
        });

        // Add hover effect
        marker.on("mouseover", function (this: L.CircleMarker) {
          this.setStyle({
            radius: 8,
            fillOpacity: 1,
          });
        });

        marker.on("mouseout", function (this: L.CircleMarker) {
          this.setStyle({
            radius: 6,
            fillOpacity: 0.8,
          });
        });

        marker.addTo(leafletMap.current);
      }
    });
  };

  // Function to reset species selection and clear occurrences
  const resetSpeciesSelection = () => {
    // Clear species selection
    setSelectedTaxonKey(null);
    setGbifQuery("");
    setGbifSuggestions([]);
    setOccurrenceData([]);

    // Clear occurrences from map
    if (leafletMap.current) {
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          leafletMap.current!.removeLayer(layer);
        }
      });
    }

    console.log("Species selection and occurrences cleared");
  };

  useEffect(() => {
    if (!leafletMap.current) return;

    const cataloniaLayer = L.geoJSON(
      cataloniaBounds.objects.municipis.geometries as any,
      {
        style: {
          color: "#3388ff",
          weight: 2,
          fillOpacity: 0.1,
        },
      }
    ).addTo(leafletMap.current);

    return () => {
      cataloniaLayer.remove();
    };
  }, []);

  // WMS layer references
  const roadsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const baseMapLayerRef = useRef<L.TileLayer | null>(null);
  const riversWaterBodiesLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const cadastralLayerRef = useRef<L.ImageOverlay | L.TileLayer.WMS | null>(
    null
  );
  const cadastralLayersRef = useRef<(L.ImageOverlay | L.TileLayer.WMS)[]>([]);
  const cadastralUpdateTimeoutRef = useRef<NodeJS.Timeout | undefined>(
    undefined
  );
  const protectedAreaLayersRef = useRef<{
    natura2000: L.TileLayer.WMS | null;
    enpe: L.TileLayer.WMS | null;
    pein: L.TileLayer.WMS | null;
    aquatic: L.TileLayer.WMS | null;
  }>({
    natura2000: null,
    enpe: null,
    pein: null,
    aquatic: null,
  });

  // State for layers radio button
  const [layerOption, setLayerOption] = useState<"connectivity" | "muscsc">(
    "connectivity"
  );
  // State for checkboxes
  const [checkboxOptions, setCheckboxOptions] = useState<CheckboxOptions>({
    satellite: false,
    roads: false,
    protectedAreas: false,
    natura2000: false,
    enpe: false,
    pein: false,
    aquaticProtected: false,
    riversWaterBodies: false,
    cadastral: false,
  });

  // Handle species radio button change
  const handleSpeciesChange = (e: any) => {
    setSpeciesOption(e.target.value);
    setShowingAllSpecies(e.target.value === "all");

    // Clear specific species data when switching to all
    if (e.target.value === "all") {
      setSelectedTaxonKey(null);
      setGbifQuery("");
      setGbifSuggestions([]);
      setOccurrenceData([]);

      // Clear occurrences from map
      if (leafletMap.current) {
        leafletMap.current.eachLayer((layer) => {
          if (layer instanceof L.CircleMarker) {
            leafletMap.current!.removeLayer(layer);
          }
        });
      }

      fetchAllSpeciesOccurrences();
    }
  };

  // Handle layers radio button change
  const handleLayerChange = (e: any) => {
    setLayerOption(e.target.value);
  };
  // Handle checkbox changes
  const handleCheckboxChange = (option: keyof CheckboxOptions) => {
    const newValue = !checkboxOptions[option];

    setCheckboxOptions((prev) => ({
      ...prev,
      [option]: newValue,
    }));

    // Handle specific layers
    switch (option) {
      case "roads":
        newValue ? addRoadsLayer() : removeRoadsLayer();
        break;
      case "satellite":
        newValue ? addSatelliteLayer() : removeSatelliteLayer();
        break;
      case "natura2000":
        newValue ? addNatura2000Layer() : removeNatura2000Layer();
        break;
      case "enpe":
        newValue ? addENPELayer() : removeENPELayer();
        break;
      case "pein":
        newValue ? addPEINLayer() : removePEINLayer();
        break;
      case "aquaticProtected":
        newValue ? addAquaticProtectedLayer() : removeAquaticProtectedLayer();
        break;
      case "riversWaterBodies":
        newValue ? addRiversWaterBodiesLayer() : removeRiversWaterBodiesLayer();
        break;
      case "cadastral":
        newValue ? addCadastralLayer() : removeCadastralLayer();
        break;
    }
  };

  // Add roads layer to the map
  const addRoadsLayer = async () => {
    if (!leafletMap.current) return;

    try {
      // If we already have a roads layer, remove it first
      if (roadsLayerRef.current) {
        leafletMap.current.removeLayer(roadsLayerRef.current);
        roadsLayerRef.current = null;
      }

      // Create a Leaflet WMS layer directly
      roadsLayerRef.current = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/XARXES_TRANSPORT/wms",
        {
          layers: "XT_GRAF_CATALEG_CARRETERES",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "Graf_Carreteres_Titular",
          opacity: 0.7,
        }
      );

      roadsLayerRef.current.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding roads layer:", err);
      setError("Failed to load roads layer");
    }
  };

  // Remove roads layer from the map
  const removeRoadsLayer = () => {
    if (!leafletMap.current || !roadsLayerRef.current) return;

    leafletMap.current.removeLayer(roadsLayerRef.current);
    roadsLayerRef.current = null;
  };

  // Add satellite layer to the map
  const addSatelliteLayer = async () => {
    if (!leafletMap.current) return;

    try {
      // If we already have a satellite layer, remove it first
      if (satelliteLayerRef.current) {
        leafletMap.current.removeLayer(satelliteLayerRef.current);
        satelliteLayerRef.current = null;
      }

      // Create a Leaflet WMS layer for satellite imagery
      satelliteLayerRef.current = L.tileLayer.wms(
        "https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms",
        {
          layers: "ortofoto_color_vigent",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          opacity: 1.0,
        }
      );

      satelliteLayerRef.current.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding satellite layer:", err);
      setError("Failed to load satellite imagery");
    }
  };

  // Remove satellite layer from the map
  const removeSatelliteLayer = () => {
    if (!leafletMap.current || !satelliteLayerRef.current) return;

    leafletMap.current.removeLayer(satelliteLayerRef.current);
    satelliteLayerRef.current = null;
  };

  // Add Natura 2000 layer
  const addNatura2000Layer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.natura2000) {
        leafletMap.current.removeLayer(
          protectedAreaLayersRef.current.natura2000
        );
        protectedAreaLayersRef.current.natura2000 = null;
      }

      protectedAreaLayersRef.current.natura2000 = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_XARNAT_2000",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_XARNAT2000",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.natura2000.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding Natura 2000 layer:", err);
      setError("Failed to load Natura 2000 layer");
    }
  };

  // Remove Natura 2000 layer
  const removeNatura2000Layer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.natura2000)
      return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.natura2000);
    protectedAreaLayersRef.current.natura2000 = null;
  };

  // Add ENPE layer
  const addENPELayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.enpe) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.enpe);
        protectedAreaLayersRef.current.enpe = null;
      }

      protectedAreaLayersRef.current.enpe = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_ENPE",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ENPE",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.enpe.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding ENPE layer:", err);
      setError("Failed to load ENPE layer");
    }
  };

  // Remove ENPE layer
  const removeENPELayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.enpe) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.enpe);
    protectedAreaLayersRef.current.enpe = null;
  };

  // Add PEIN layer
  const addPEINLayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.pein) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.pein);
        protectedAreaLayersRef.current.pein = null;
      }

      protectedAreaLayersRef.current.pein = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_PEIN",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_PEIN",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.pein.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding PEIN layer:", err);
      setError("Failed to load PEIN layer");
    }
  };

  // Remove PEIN layer
  const removePEINLayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.pein) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.pein);
    protectedAreaLayersRef.current.pein = null;
  };

  // Add Aquatic Protected Areas layer
  const addAquaticProtectedLayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (protectedAreaLayersRef.current.aquatic) {
        leafletMap.current.removeLayer(protectedAreaLayersRef.current.aquatic);
        protectedAreaLayersRef.current.aquatic = null;
      }

      protectedAreaLayersRef.current.aquatic = L.tileLayer.wms(
        "https://sig.gencat.cat/ows/ESPAIS_NATURALS/wms",
        {
          layers: "ESPAISNATURALS_ZONHUMIDES",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "ESTIL_ZONES_HUMIDES",
          opacity: 0.7,
        }
      );

      protectedAreaLayersRef.current.aquatic.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding Aquatic Protected Areas layer:", err);
      setError("Failed to load Aquatic Protected Areas layer");
    }
  };

  // Remove Aquatic Protected Areas layer
  const removeAquaticProtectedLayer = () => {
    if (!leafletMap.current || !protectedAreaLayersRef.current.aquatic) return;

    leafletMap.current.removeLayer(protectedAreaLayersRef.current.aquatic);
    protectedAreaLayersRef.current.aquatic = null;
  };

  // Add Rivers and Water Bodies layer
  const addRiversWaterBodiesLayer = async () => {
    if (!leafletMap.current) return;

    try {
      if (riversWaterBodiesLayerRef.current) {
        leafletMap.current.removeLayer(riversWaterBodiesLayerRef.current);
        riversWaterBodiesLayerRef.current = null;
      }

      riversWaterBodiesLayerRef.current = L.tileLayer.wms(
        "https://geoserveis.ide.cat/servei/catalunya/inspire-hidrografia/wms",
        {
          layers: "HY.PhysicalWaters.Waterbodies",
          format: "image/png",
          transparent: true,
          version: "1.3.0",
          styles: "HY.PhysicalWaters.Waterbodies.Default",
          opacity: 0.7,
        }
      );

      riversWaterBodiesLayerRef.current.addTo(leafletMap.current);
    } catch (err) {
      console.error("Error adding Rivers and Water Bodies layer:", err);
      setError("Failed to load Rivers and Water Bodies layer");
    }
  };

  // Remove Rivers and Water Bodies layer
  const removeRiversWaterBodiesLayer = () => {
    if (!leafletMap.current || !riversWaterBodiesLayerRef.current) return;

    leafletMap.current.removeLayer(riversWaterBodiesLayerRef.current);
    riversWaterBodiesLayerRef.current = null;
  };

  // Add Cadastral Information layer using Parse Cloud Function
  const addCadastralLayer = async () => {
    if (!leafletMap.current) return;

    try {
      // Always remove all existing layers first to prevent stacking
      removeCadastralLayer();

      console.log("Adding cadastral layer using Parse Cloud Function...");

      // Get current map bounds
      const bounds = leafletMap.current.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

      // Call Parse Cloud Function to get cadastral data
      const result = await Parse.Cloud.run("getCadastralWMS", {
        bbox: bbox,
        width: 512,
        height: 512,
      });

      if (result.status !== "success" || !result.data) {
        throw new Error("Failed to fetch cadastral data");
      }

      // Convert base64 to blob for image overlay
      const binaryString = atob(result.data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uintArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < binaryString.length; i++) {
        uintArray[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: "image/png" });
      const imageUrl = URL.createObjectURL(blob);

      // Create image overlay without attribution to avoid changing map attribution
      const cadastralOverlay = L.imageOverlay(
        imageUrl,
        [
          [bounds.getSouth(), bounds.getWest()],
          [bounds.getNorth(), bounds.getEast()],
        ],
        {
          opacity: 0.7,
          // Don't add attribution to prevent changing map attribution text
        }
      );

      cadastralOverlay.addTo(leafletMap.current);
      cadastralLayerRef.current = cadastralOverlay;

      // Also add to our tracking array for comprehensive cleanup
      cadastralLayersRef.current.push(cadastralOverlay);

      console.log("Cadastral overlay added successfully");

      // Clean up blob URL after a delay to ensure image is loaded
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 5000);
    } catch (err) {
      console.error("Error adding Cadastral layer:", err);
      setError(
        `Failed to load Cadastral layer: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Remove all Cadastral Information layers
  const removeCadastralLayer = () => {
    if (!leafletMap.current) return;

    console.log("Removing all cadastral layers");

    // Remove the current layer if it exists
    if (cadastralLayerRef.current) {
      leafletMap.current.removeLayer(cadastralLayerRef.current);
      cadastralLayerRef.current = null;
    }

    // Remove all layers from the array (in case any got orphaned)
    cadastralLayersRef.current.forEach((layer) => {
      try {
        if (leafletMap.current && leafletMap.current.hasLayer(layer)) {
          leafletMap.current.removeLayer(layer);
        }
      } catch (error) {
        console.warn("Error removing cadastral layer:", error);
      }
    });

    // Clear the array
    cadastralLayersRef.current = [];

    // Also remove any image overlays that might be cadastral layers
    leafletMap.current.eachLayer((layer) => {
      if (layer instanceof L.ImageOverlay) {
        // Check if this might be a cadastral layer by looking at attribution
        if (layer.options.attribution?.includes("Catastro")) {
          leafletMap.current?.removeLayer(layer);
        }
      }
    });

    console.log("All cadastral layers removed");
  };

  // Function to update cadastral layer when map view changes
  const updateCadastralLayer = useCallback(async () => {
    if (!checkboxOptions.cadastral || !leafletMap.current) return;

    console.log("Updating cadastral layer for new map bounds");
    // Remove all existing layers first to prevent stacking
    removeCadastralLayer();
    // Add new layer with current bounds
    await addCadastralLayer();
  }, [checkboxOptions.cadastral]);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([41.7, 1.7], 7);

      // Store reference to the base map layer
      baseMapLayerRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
        }
      );
      baseMapLayerRef.current.addTo(leafletMap.current);
    }
  }, []);

  const updateMap = (rasterLayer: any, georaster: any) => {
    if (leafletMap.current && rasterLayer) {
      // Store current view state
      const currentCenter = leafletMap.current.getCenter();
      const currentZoom = leafletMap.current.getZoom();

      // Remove only GeoRasterLayers, keep other layers intact
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof GeoRasterLayer) {
          leafletMap.current?.removeLayer(layer);
        }
      });

      rasterLayer.addTo(leafletMap.current);

      rasterLayer.on("load", () => {
        setLoading(false); // Set loading to false only after layer is loaded
      });

      // Only fit bounds on first load
      if (!hasLoadedAnyLayer) {
        const layerBounds = rasterLayer.getBounds();
        leafletMap.current.fitBounds(layerBounds);
        setHasLoadedAnyLayer(true); // Mark that we've loaded at least one layer
      } else {
        // For subsequent loads, maintain the previous center and zoom
        leafletMap.current.setView(currentCenter, currentZoom, {
          animate: false,
        });
      }

      // Make sure our raster layer is above the satellite but below the roads
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.bringToBack();
      }

      if (roadsLayerRef.current) {
        roadsLayerRef.current.bringToFront();
      }

      leafletMap.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        // Convert WGS84 (Lat, Lng) to EPSG:32631 (Easting, Northing)
        const [easting, northing] = proj4(wgs84, epsg32631, [lng, lat]);
        const pixelCoords = geoToPixel(georaster, easting, northing);
        // Get value using geoblaze.identify with converted coordinates
        const values = await geoblaze.identify(georaster, [easting, northing]);

        // Create popup content with all information
        let popupContent = `<div style="font-family: Arial, sans-serif">
    <p><strong>WGS84:</strong> Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(
          6
        )}</p>
    <p><strong>EPSG:32631:</strong> Easting: ${easting.toFixed(
      2
    )}, Northing: ${northing.toFixed(2)}</p>
    <p><strong>Value:</strong> ${values !== null ? values : "No data"}</p>`;

        // Add pixel information if available
        //     if (pixelCoords) {
        //       const { col, row } = pixelCoords;
        //       const rasterValue = georaster.values[0][row][col];
        //       popupContent += `<p><strong>Pixel Coordinates:</strong> Row: ${row}, Col: ${col}</p>
        // <p><strong>Raster Value:</strong> ${
        //   rasterValue !== null ? rasterValue : "No data"
        // }</p>`;
        //     }

        popupContent += "</div>"; // Create and open a popup at the clicked location
        if (leafletMap.current) {
          L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(leafletMap.current);
        }
      });
    }
  };

  const fetchImage = async () => {
    setLoading(true);
    setError("");
    try {
      // Call the appropriate Parse Cloud Function
      const result = await Parse.Cloud.run(
        layerOption === "connectivity" ? "getConnectivity" : "getMucsc",
        layerOption === "connectivity" ? { time, properties } : { time }
      );

      if (result.status !== "success" || !result.data) {
        throw new Error("Failed to fetch image data");
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(result.data);
      const arrayBuffer = new ArrayBuffer(binaryString.length);
      const uintArray = new Uint8Array(arrayBuffer);

      for (let i = 0; i < binaryString.length; i++) {
        uintArray[i] = binaryString.charCodeAt(i);
      }

      // Parse the GeoTIFF
      const georaster = await geoblaze.parse(arrayBuffer);
      const rasterLayer = await createRaster(georaster, layerOption);

      updateMap(rasterLayer, georaster);
    } catch (err) {
      console.error("Error fetching the image:", err);
      setError("Error fetching the image.");
    } finally {
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

  // Effect to manage layers when relevant state changes
  useEffect(() => {
    if (checkboxOptions.roads) {
      addRoadsLayer();
    } else {
      removeRoadsLayer();
    }

    if (checkboxOptions.satellite) {
      addSatelliteLayer();
    } else {
      removeSatelliteLayer();
    }

    if (checkboxOptions.natura2000) {
      addNatura2000Layer();
    } else {
      removeNatura2000Layer();
    }

    if (checkboxOptions.enpe) {
      addENPELayer();
    } else {
      removeENPELayer();
    }

    if (checkboxOptions.pein) {
      addPEINLayer();
    } else {
      removePEINLayer();
    }

    if (checkboxOptions.aquaticProtected) {
      addAquaticProtectedLayer();
    } else {
      removeAquaticProtectedLayer();
    }

    if (checkboxOptions.riversWaterBodies) {
      addRiversWaterBodiesLayer();
    } else {
      removeRiversWaterBodiesLayer();
    }

    if (checkboxOptions.cadastral) {
      addCadastralLayer();
    } else {
      removeCadastralLayer();
      // Also clear any pending timeouts when unchecking
      if (cadastralUpdateTimeoutRef.current) {
        clearTimeout(cadastralUpdateTimeoutRef.current);
        cadastralUpdateTimeoutRef.current = undefined;
      }
    }
  }, [
    checkboxOptions.roads,
    checkboxOptions.satellite,
    checkboxOptions.natura2000,
    checkboxOptions.enpe,
    checkboxOptions.pein,
    checkboxOptions.aquaticProtected,
    checkboxOptions.riversWaterBodies,
    checkboxOptions.cadastral,
  ]);

  // Effect to add map event listeners for cadastral layer
  useEffect(() => {
    if (!leafletMap.current) return;

    const handleMapMove = () => {
      if (!checkboxOptions.cadastral) return;

      console.log("Map moved, scheduling cadastral layer update");
      // Clear existing timeout
      if (cadastralUpdateTimeoutRef.current) {
        clearTimeout(cadastralUpdateTimeoutRef.current);
      }

      // Debounce the update to avoid too many requests
      cadastralUpdateTimeoutRef.current = setTimeout(() => {
        updateCadastralLayer();
      }, 500);
    };

    if (checkboxOptions.cadastral) {
      console.log("Adding cadastral layer event listeners");
      leafletMap.current.on("moveend", handleMapMove);
      leafletMap.current.on("zoomend", handleMapMove);
    } else {
      console.log("Removing cadastral layer event listeners");
      leafletMap.current.off("moveend", handleMapMove);
      leafletMap.current.off("zoomend", handleMapMove);

      // Clear any pending timeouts when checkbox is unchecked
      if (cadastralUpdateTimeoutRef.current) {
        clearTimeout(cadastralUpdateTimeoutRef.current);
        cadastralUpdateTimeoutRef.current = undefined;
      }
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.off("moveend", handleMapMove);
        leafletMap.current.off("zoomend", handleMapMove);
      }

      // Cleanup any timeouts if they exist
      if (cadastralUpdateTimeoutRef.current) {
        clearTimeout(cadastralUpdateTimeoutRef.current);
        cadastralUpdateTimeoutRef.current = undefined;
      }
    };
  }, [checkboxOptions.cadastral, updateCadastralLayer]);

  // Legend component
  const LegendComponent = ({
    layerOption,
  }: {
    layerOption: "connectivity" | "muscsc";
  }) => {
    if (layerOption === "muscsc") {
      const muscscItems = [
        { value: 1, color: "rgb(153, 247, 245)", label: "Aquatic" },
        { value: 2, color: "rgb(164, 0, 0)", label: "Built area" },
        { value: 3, color: "rgb(255, 255, 140)", label: "Herbaceous cropland" },
        { value: 4, color: "rgb(255, 200, 145)", label: "Woody cropland" },
        {
          value: 5,
          color: "rgb(145, 134, 0)",
          label: "Shrubland and grassland",
        },
        { value: 6, color: "rgb(0, 132, 0)", label: "Forestland" },
        {
          value: 7,
          color: "rgb(184, 201, 189)",
          label: "Bare/sparse vegetation",
        },
      ];

      return (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            background: "white",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 999, // Slightly lower than toggle button
            maxWidth: "250px",
            border: "1px solid #d9d9d9",
          }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            MUCSC Land Cover
          </h4>
          {muscscItems.map((item) => (
            <div
              key={item.value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "15px",
                  backgroundColor: item.color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "2px",
                }}
              />
              <span style={{ fontSize: "12px", color: "#333" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      );
    } else {
      // Connectivity index legend - create a gradient using actual colorRamp colors
      const createConnectivityGradient = () => {
        // Sample key points from the colorRamp
        const keyPoints = [
          colorRamp["0"], // 0
          colorRamp["51"], // 0.5
          colorRamp["102"], // 1.0
          colorRamp["153"], // 1.5
          colorRamp["204"], // 2.0
          colorRamp["255"], // 2.5
        ];

        return `linear-gradient(to right, ${keyPoints.join(", ")})`;
      };

      return (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            background: "white",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 999, // Slightly lower than toggle button
            maxWidth: "200px",
            border: "1px solid #d9d9d9",
          }}
        >
          {" "}
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "14px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Connectivity Index
            <InfoCircleOutlined
              style={{
                fontSize: "14px",
                color: "#42A456",
                cursor: "pointer",
              }}
              onClick={() => setIsInfoModalVisible(true)}
            />
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Gradient bar using actual colorRamp */}
            <div
              style={{
                width: "150px",
                height: "20px",
                background: createConnectivityGradient(),
                border: "1px solid #ccc",
                borderRadius: "2px",
                marginBottom: "8px",
              }}
            />
            {/* Labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "150px",
                fontSize: "11px",
              }}
            >
              <span>0</span>
              <span style={{ textAlign: "center" }}>1.25</span>
              <span>2.5</span>
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                marginTop: "4px",
                textAlign: "center",
              }}
            >
              Higher values indicate better connectivity
            </div>
          </div>
        </div>
      );
    }
  };

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
      const color = (colorRamp as Record<string, string>)[
        clampedValue.toString()
      ];

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
      <style>
        {`
          .protected-areas-collapse .ant-collapse-item {
            border: none !important;
          }
          .protected-areas-collapse .ant-collapse-header {
            padding: 4px 0 4px 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
            line-height: 1.5715 !important;
            display: flex !important;
            align-items: center !important;
          }
          .protected-areas-collapse .ant-collapse-arrow {
            position: static !important;
            margin-right: 8px !important;
            line-height: 1 !important;
          }
          .protected-areas-collapse .ant-collapse-content {
            border: none !important;
            background: transparent !important;
          }
          .protected-areas-collapse .ant-collapse-content-box {
            padding: 0 !important;
            padding-top: 8px !important;
          }
        `}
      </style>
      <Row style={{ width: "100%", height: "100px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-bioconn-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      {/* Content Row */}
      <ConfigProvider
        wave={{ disabled: true }}
        theme={{
          token: {
            colorPrimary: "#96F5D0",
            colorTextLightSolid: "black",
            borderRadius: 6,
            fontSize: 16,
          },
        }}
      >
        <Row style={{ width: "100%", display: "flex" }}>
          <div style={{ width: "30%", padding: "16px" }}>
            {/* Map Settings Heading */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ margin: 0 }}>Connectivity Calculation</h2>
              <InfoCircleOutlined
                style={{
                  fontSize: "18px",
                  color: "#42A456",
                  cursor: "pointer",
                }}
                onClick={() => setIsInfoModalVisible(true)}
              />
            </div>

            {/* Layers Section */}
            <div style={{ marginBottom: "24px" }}>
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

            {/* Species Section */}
            <div style={{ marginBottom: "24px" }}>
              <h2>Layers</h2>
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
                  Show specific species from GBIF
                </Radio>
              </Radio.Group>

              {speciesOption === "specific" && (
                <>
                  <Input.Search
                    placeholder="Search GBIF species..."
                    value={gbifQuery}
                    onChange={(e) => {
                      setGbifQuery(e.target.value);
                      searchGbifSpecies(e.target.value);
                    }}
                    onSearch={searchGbifSpecies}
                    style={{ marginTop: 8 }}
                  />

                  {gbifSuggestions.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {gbifSuggestions.map((species) => (
                        <div
                          key={species.key}
                          style={{
                            padding: 8,
                            cursor: "pointer",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f5f5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "";
                          }}
                          onClick={() => {
                            setSelectedTaxonKey(species.key);
                            setGbifQuery(species.scientificName);
                            setGbifSuggestions([]);
                          }}
                        >
                          {species.scientificName}
                          {species.commonName && ` (${species.commonName})`}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTaxonKey && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 4 }}>
                        Selected: <strong>{gbifQuery}</strong>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          type="primary"
                          onClick={fetchGbifOccurrences}
                          loading={loading}
                        >
                          Load Occurrences
                        </Button>
                        <Button
                          onClick={resetSpeciesSelection}
                          disabled={loading}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Divider></Divider>

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
                checked={checkboxOptions.riversWaterBodies}
                onChange={() => handleCheckboxChange("riversWaterBodies")}
              >
                Rivers and Water Bodies
              </Checkbox>
              <br />
              <Checkbox
                checked={checkboxOptions.cadastral}
                onChange={() => handleCheckboxChange("cadastral")}
              >
                Cadastral Information
              </Checkbox>
              <br />

              {/* Protected Areas Collapse */}
              <Collapse
                bordered={false}
                expandIcon={({ isActive }) => (
                  <DownOutlined rotate={isActive ? 180 : 0} />
                )}
                style={{ background: "transparent" }}
                className="protected-areas-collapse"
              >
                <Panel
                  header="Protected Areas"
                  key="1"
                  style={{ padding: 0 }}
                  // extra={
                  //   <Checkbox
                  //     checked={checkboxOptions.protectedAreas}
                  //     onChange={(e) => {
                  //       e.stopPropagation();
                  //       handleCheckboxChange("protectedAreas");
                  //     }}
                  //   />
                  // }
                >
                  <div style={{ marginLeft: "24px" }}>
                    <Checkbox
                      checked={checkboxOptions.natura2000}
                      onChange={() => handleCheckboxChange("natura2000")}
                    >
                      Natura 2000
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.enpe}
                      onChange={() => handleCheckboxChange("enpe")}
                    >
                      ENPE
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.pein}
                      onChange={() => handleCheckboxChange("pein")}
                    >
                      PEIN
                    </Checkbox>
                    <br />
                    <Checkbox
                      checked={checkboxOptions.aquaticProtected}
                      onChange={() => handleCheckboxChange("aquaticProtected")}
                    >
                      Aquatic Protected Areas
                    </Checkbox>
                  </div>
                </Panel>
              </Collapse>
            </div>

            {/* Buttons Section */}
            <div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                }}
                onClick={() => navigate("/bioconnect/scenario")}
              >
                Create Scenario
              </Button>
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
                value={xCoord || ""}
                onChange={(e) => setXCoord(e.target.value || null)}
                style={{ width: "120px" }}
              />
              <Input
                placeholder="Northing (Y)"
                value={yCoord || ""}
                onChange={(e) => setYCoord(e.target.value || null)}
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
                height: "550px",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
              {/* Legend Component - Always visible */}
              <LegendComponent layerOption={layerOption} />
            </div>

            {/* Slider under the map */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Slider
                min={0}
                max={availableTimes.length - 1}
                defaultValue={7}
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
                tooltip={{ formatter: null }}
              />
            </div>
          </div>
        </Row>

        {/* Info Modal for Connectivity */}
        <Modal
          title="Connectivity Calculation Information"
          open={isInfoModalVisible}
          onCancel={() => setIsInfoModalVisible(false)}
          centered
          width={800}
          footer={[
            <Button
              key="ok"
              type="primary"
              onClick={() => setIsInfoModalVisible(false)}
            >
              OK
            </Button>,
          ]}
          styles={{
            header: {
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #e8e8e8",
            },
          }}
        >
          <div
            style={{
              padding: "20px 0",
              lineHeight: "1.6",
              color: "#333",
              textAlign: "left",
            }}
          >
            <p>
              The tool is based on the Terrestrial Connectivity Index (ICT)
              algorithm [Marulli J. and Mallarach J., 2005] and [Serral I. et
              al., 2024], which gives an aggregate index of the connectivity
              from that pixel considering the surrounding ones and the friction
              among land uses/covers. Values range from 0 (poor connectivity) to
              2.5 (high connectivity) for that specific land use/cover. This
              algorithm is highly machine and time consuming, so ML techniques
              have been applied in this case to fasten the calculation. The ICT
              result given in the BioConnect tool is, thus, an approximation and
              should be considered like this. Output results are shown together
              to ensure trustworthiness and enhance decision making.
              <br />
              <br />
              <strong>References:</strong>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>
                  Marulli J. and Mallarach J., 2005.
                  <br />
                  <em>
                    "A GIS methodology for assessing ecological connectivity:
                    application to the Barcelona Metropolitan Area,"
                  </em>
                  <br />
                  Landscape and Urban Planning, vol. 71, no. 2–4, pp. 243-262.
                </li>
                <li>
                  Serral I. et al., 2024.
                  <br />
                  <em>
                    "Terrestrial Connectivity Based on Landsat/Sentinel Land
                    Cover Classes as a Biodiversity Indicator for the European
                    Green Deal Data Space,"
                  </em>
                  <br />
                  IGARSS 2024 - 2024 IEEE International Geoscience and Remote
                  Sensing Symposium, Athens, Greece, 2024, pp. 2328-2331.
                  <br />
                  DOI:{" "}
                  <a
                    href="https://doi.org/10.1109/IGARSS53475.2024.10640524"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    10.1109/IGARSS53475.2024.10640524
                  </a>
                </li>
              </ul>
            </p>
          </div>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default BioConn;
