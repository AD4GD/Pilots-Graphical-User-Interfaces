import Parse from "parse";
import { useState, useEffect } from "react";

interface LakeWQIData {
  lakeId: string;
  lakeName: string;
  wqiStatus: number | null;
  wqiTrend: number | null;
  color: string;
}

/**
 * Custom hook to fetch WQI data for multiple lakes and calculate their colors
 */
export const useLakeWQIColors = (lakes: { id: string; label: string }[]) => {
  const [wqiData, setWqiData] = useState<Record<string, LakeWQIData>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Function to calculate color based on WQI value (same logic as multicolorbar)
  const getWQIColor = (
    value: number,
    minValue: number,
    maxValue: number
  ): string => {
    // Clamp the value within the min and max range
    const clampedValue = Math.max(minValue, Math.min(value, maxValue));

    // Calculate the percentage position
    const percentage =
      ((clampedValue - minValue) / (maxValue - minValue)) * 100;

    // Gradient color stops (same as multicolorbar)
    const gradientColors = [
      { stop: 0, color: "#dc3545" }, // Red
      { stop: 30, color: "#f2d261" }, // Yellow
      { stop: 70, color: "#6fa053" }, // Green
    ];

    // Find the appropriate color range
    for (let i = 0; i < gradientColors.length - 1; i++) {
      const start = gradientColors[i];
      const end = gradientColors[i + 1];

      if (percentage >= start.stop && percentage <= end.stop) {
        const ratio = (percentage - start.stop) / (end.stop - start.stop);
        return interpolateColor(start.color, end.color, ratio);
      }
    }
    return gradientColors[gradientColors.length - 1].color;
  };

  const interpolateColor = (
    color1: string,
    color2: string,
    ratio: number
  ): string => {
    const hex = (color: string) => parseInt(color.slice(1), 16);
    const r1 = (hex(color1) >> 16) & 255;
    const g1 = (hex(color1) >> 8) & 255;
    const b1 = hex(color1) & 255;

    const r2 = (hex(color2) >> 16) & 255;
    const g2 = (hex(color2) >> 8) & 255;
    const b2 = hex(color2) & 255;

    const r = Math.round(r1 + ratio * (r2 - r1));
    const g = Math.round(g1 + ratio * (g2 - g1));
    const b = Math.round(b1 + ratio * (b2 - b1));

    return `rgb(${r}, ${g}, ${b})`;
  };

  useEffect(() => {
    const fetchWQIData = async () => {
      if (lakes.length === 0) return;

      setLoading(true);
      try {
        // First, get min/max values for normalization
        const wqiQuery = new Parse.Query("AD4GD_Lake_Quality_Index");

        const maxResults = await wqiQuery
          .select("WQI_status")
          .descending("WQI_status")
          .limit(1)
          .find();

        const minResults = await wqiQuery
          .select("WQI_status")
          .ascending("WQI_status")
          .limit(1)
          .find();

        const maxValue =
          maxResults.length > 0 ? maxResults[0].get("WQI_status") : 100;
        const minValue =
          minResults.length > 0 ? minResults[0].get("WQI_status") : 0;

        // Get all WQI data
        const allWQIData = await new Parse.Query(
          "AD4GD_Lake_Quality_Index"
        ).find();

        const wqiMap: Record<string, LakeWQIData> = {};

        for (const lake of lakes) {
          // Try exact match first
          let wqiEntry = allWQIData.find(
            (entry) => entry.get("lake") === lake.label
          );

          // If no exact match, try fuzzy matching
          if (!wqiEntry) {
            const lakeName = lake.label.toLowerCase().trim();
            wqiEntry = allWQIData.find((entry) => {
              const entryName = entry.get("lake")?.toLowerCase().trim();
              return (
                entryName?.includes(lakeName) || lakeName.includes(entryName)
              );
            });
          }

          if (wqiEntry) {
            const wqiStatus = wqiEntry.get("WQI_status");
            const wqiTrend = wqiEntry.get("WQI_trend");
            const color = getWQIColor(wqiStatus, minValue, maxValue);

            wqiMap[lake.id] = {
              lakeId: lake.id,
              lakeName: lake.label,
              wqiStatus,
              wqiTrend,
              color,
            };
          } else {
            // No WQI data available - use grey color
            wqiMap[lake.id] = {
              lakeId: lake.id,
              lakeName: lake.label,
              wqiStatus: null,
              wqiTrend: null,
              color: "#8c8c8c", // Grey color for no data
            };
          }
        }

        setWqiData(wqiMap);
      } catch (error) {
        console.error("Error fetching WQI data:", error); // Set default colors for all lakes on error
        const defaultMap: Record<string, LakeWQIData> = {};
        lakes.forEach((lake) => {
          defaultMap[lake.id] = {
            lakeId: lake.id,
            lakeName: lake.label,
            wqiStatus: null,
            wqiTrend: null,
            color: "#8c8c8c", // Grey for no data
          };
        });
        setWqiData(defaultMap);
      } finally {
        setLoading(false);
      }
    };

    fetchWQIData();
  }, [lakes]);

  return { wqiData, loading };
};
