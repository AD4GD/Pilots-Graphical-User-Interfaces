// useSensorData.ts
import { useEffect, useState } from "react";
import { useDataService } from "@opendash/plugin-timeseries";
import { FilterType, SensorData } from "../types/Lake_Stats";

// The hook will return the transformed sensor data based on the filter and date range
export const useSensorData = (
  items: any[],
  selectedFilter: FilterType,
  startDate: number | null,
  endDate: number | null
): SensorData[] => {
  const [data, setData] = useState<SensorData[]>([]);
  const DataService = useDataService();

  useEffect(() => {
    const separateSensors = async () => {
      const targetIds = [
        "sensor_halensee_precipitation",
        "sensor_halensee_evaporation",
      ];
      const matched: any[] = [];
      const remaining: any[] = [];

      items.forEach((item) => {
        if (Array.isArray(item) && item[0] && targetIds.includes(item[0].id)) {
          matched.push(item);
        } else {
          remaining.push(item);
        }
      });

      try {
        const matchedData = await fetchData(
          matched,
          selectedFilter,
          startDate,
          endDate,
          "sum"
        );
        const remainingData = await fetchData(
          remaining,
          selectedFilter,
          startDate,
          endDate,
          "avg"
        );

        const combinedData = [...matchedData, ...remainingData];
        setData(combinedData);
      } catch (error) {
        console.error("Error fetching sensor data", error);
      }
    };

    separateSensors();
  }, [items, selectedFilter, startDate, endDate, DataService]);

  // Fetch data based on selected filter and date range
  const fetchData = async (
    items: any[],
    filter: FilterType,
    startDate?: number | null,
    endDate?: number | null,
    aggregationOperation?: string
  ): Promise<SensorData[]> => {
    const filterUnitMap: Record<FilterType, "day" | "week" | "month" | "year"> =
      {
        daily: "day",
        weekly: "week",
        monthly: "month",
        yearly: "year",
      };

    const result = await DataService.fetchDimensionValuesMultiItem(items, {
      historyType: startDate && endDate ? "absolute" : "relative",
      unit: "month",
      start: startDate ?? undefined,
      end: endDate ?? undefined,
      value: 1000,
      aggregation: true,
      aggregationOperation: aggregationOperation,
      aggregationDateUnit: filterUnitMap[filter],
    });
    return transformData(result);
  };

  // Transform raw data into usable format
  const transformData = (data: any[]): SensorData[] => {
    return data.map((item: any[]) => {
      const { id, name: lake, valueTypes } = item[0];
      const propertyName = valueTypes[0].name;
      const unit = valueTypes[0].unit;
      const dataPoints = item[2];

      return { id, lake, propertyName, unit, data: dataPoints };
    });
  };

  return data;
};
