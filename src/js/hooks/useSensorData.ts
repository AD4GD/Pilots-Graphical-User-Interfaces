import { useEffect, useState, useRef } from "react";
import { useDataService } from "@opendash/plugin-timeseries";
import { FilterType, SensorData } from "../types/Lake_Stats";
import { DateUnitInterface } from "@opendash/plugin-timeseries";

export const useSensorData = (
  items: any[],
  selectedFilter: FilterType,
  startDate: number | null,
  endDate: number | null,
  unitType: DateUnitInterface = "month",
  numberOfvalues: number = 1000
): SensorData[] => {
  const [data, setData] = useState<SensorData[]>([]);
  const DataService = useDataService();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const separateSensors = async () => {
      // Don't clear data immediately, keep old data until new arrives
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

        if (isMounted.current) {
          setData(combinedData);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error("Error fetching sensor data", error);
          // Keep old data on error (no reset)
        }
      }
    };

    separateSensors();

    return () => {
      isMounted.current = false;
    };
  }, [
    items,
    selectedFilter,
    startDate,
    endDate,
    unitType,
    numberOfvalues,
    DataService,
  ]);

  // fetchData and transformData unchanged
  const fetchData = async (
    items: any[],
    filter: FilterType,
    startDate?: number | null,
    endDate?: number | null,
    aggregationOperation: string = "avg"
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
      unit: unitType,
      start: startDate ?? undefined,
      end: endDate ?? undefined,
      value: numberOfvalues,
      aggregation: true,
      aggregationOperation: aggregationOperation,
      aggregationDateUnit: filterUnitMap[filter],
    });

    return transformData(result);
  };

  const transformData = (data: any[]): SensorData[] => {
    return data.map((item: any[]) => {
      const { id, name: lake, valueTypes } = item[0];
      const propertyName = valueTypes[0]?.name ?? "Unknown";
      const unit = valueTypes[0]?.unit ?? "";
      const dataPoints = item[2];

      return { id, lake, propertyName, unit, data: dataPoints };
    });
  };

  return data;
};
