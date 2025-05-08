import { useMemo } from "react";
import { DataPoint, SensorData, ChartData } from "../types/Lake_Stats";

export const useChartDataTransform = (
  data: SensorData[],
  selectedProperties: string[]
): ChartData[] => {
  return useMemo(() => {
    return data
      .filter((sensor) => selectedProperties.includes(sensor.propertyName))
      .map(
        (sensor): ChartData => ({
          type: "line",
          name: sensor.propertyName,
          unit: sensor.unit,
          data: sensor.data.map((point: DataPoint) => [
            new Date(point.date).getTime(),
            point.value,
          ]),
        })
      );
  }, [data, selectedProperties]);
};
