import { useEffect, useState, useRef } from "react";
import { useDataService } from "@opendash/plugin-timeseries";
import { FilterType, SensorData } from "../types/Lake_Stats";
import { DateUnitInterface } from "@opendash/plugin-timeseries";
import isEqual from "lodash.isequal";

// Transform raw response into SensorData[]
const transformData = (data: any[]): SensorData[] => {
  return data.map((item: any[]) => {
    const { id, name: lake, valueTypes } = item[0];
    const propertyName = valueTypes[0]?.name ?? "Unknown";
    const unit = valueTypes[0]?.unit ?? "";
    const dataPoints = item[2];
    return { id, lake, propertyName, unit, data: dataPoints };
  });
};

const fetchData = async (
  DataService: ReturnType<typeof useDataService>,
  items: any[],
  filter: FilterType,
  startDate: number | null,
  endDate: number | null,
  unitType: DateUnitInterface,
  numberOfvalues: number,
  aggregationOperation: string
): Promise<SensorData[]> => {
  const filterUnitMap: Record<FilterType, "day" | "week" | "month" | "year"> = {
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
    aggregationOperation,
    aggregationDateUnit: filterUnitMap[filter],
  });

  return transformData(result);
};

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

    const load = async () => {
      try {
        const [matchedData, remainingData] = await Promise.all([
          fetchData(
            DataService,
            matched,
            selectedFilter,
            startDate,
            endDate,
            unitType,
            numberOfvalues,
            "sum"
          ),
          fetchData(
            DataService,
            remaining,
            selectedFilter,
            startDate,
            endDate,
            unitType,
            numberOfvalues,
            "avg"
          ),
        ]);

        const combinedData = [...matchedData, ...remainingData];

        if (isMounted.current && !isEqual(combinedData, data)) {
          setData(combinedData);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error("Sensor data fetch error", error);
        }
      }
    };

    load();

    return () => {
      isMounted.current = false;
    };
  }, [
    JSON.stringify(items.map((i) => i[0]?.id)), // only re-fetch when sensor IDs change
    selectedFilter,
    startDate,
    endDate,
    unitType,
    numberOfvalues,
  ]);

  return data;
};
