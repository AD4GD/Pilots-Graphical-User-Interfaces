import html2canvas from "html2canvas";
import { SensorData } from "../types/Lake_Stats";

export const downloadGraphAsPng = (
  chartRef: React.RefObject<HTMLDivElement>,
  data: SensorData[],
  selectedFilter: string
): void => {
  if (chartRef.current) {
    html2canvas(chartRef.current).then((canvas) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const lakeName =
        data.length > 0 ? data[0].lake.split(" ")[0] : "sensor_data";
      const fileName = `${lakeName}-${selectedFilter} (${timestamp}).png`;

      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = fileName;
      link.click();
    });
  }
};

export const downloadDataAsCsv = (data: SensorData[]): void => {
  const csvRows: string[] = [];
  const allTimestamps = new Set<string>();
  const sensorNames = new Set<string>();

  data.forEach((sensor) => {
    sensor.data.forEach((dataPoint) => {
      allTimestamps.add(dataPoint.date);
    });
    sensorNames.add(`${sensor.propertyName} (${sensor.unit})`);
  });

  const timestampsArray = Array.from(allTimestamps).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const headers = ["Timestamp", ...Array.from(sensorNames)];
  csvRows.push(headers.join(","));

  const sensorDataMap: Record<string, Record<string, number>> = {};
  timestampsArray.forEach((timestamp) => {
    sensorDataMap[timestamp] = {};
  });

  data.forEach((sensor) => {
    sensor.data.forEach((dataPoint) => {
      const timestamp = dataPoint.date;
      const sensorKey = `${sensor.propertyName} (${sensor.unit})`;
      sensorDataMap[timestamp][sensorKey] = dataPoint.value;
    });
  });

  timestampsArray.forEach((timestamp) => {
    const row: string[] = [new Date(timestamp).toISOString()];
    headers.slice(1).forEach((sensorKey) => {
      const value = sensorDataMap[timestamp][sensorKey] || "";
      row.push(value.toString());
    });
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const lakeName = data.length > 0 ? data[0].lake.split(" ")[0] : "sensor_data";
  const filename = `${lakeName}_sensors_data.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
