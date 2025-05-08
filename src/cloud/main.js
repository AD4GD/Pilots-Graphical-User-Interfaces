const { init: initOpenDash } = require("@openinc/parse-server-opendash");
const csv = require("csv-parse/lib/sync"); // need csv-parse

setTimeout(() => main(), 1000);

async function main() {
  await initOpenDash();

  // Cloud code getData for testing
  Parse.Cloud.define("getData", async (request) => {
    const { param1, param2 } = request.params;

    const query = new Parse.Query("AD4GD_LakeMetaData");
    const results = await query.find();

    return results.map((item) => item.toJSON());
  });

  // Cloud Function for upload csv
  Parse.Cloud.define("uploadLakeDataCSV", async (request) => {
    const { lakeName, sensorName, unit } = request.params;
    const file = request.params.file;

    if (!lakeName || !sensorName || !unit || !file) {
      throw new Error(
        "Missing required parameters: lakeName, sensorName, unit, or file."
      );
    }

    // Parse CSV file
    const csvData = file.toString("utf-8");
    const records = csv(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const LakeData = Parse.Object.extend("TestLakeClass");

    const lakeDataEntries = records.map((record) => {
      const entry = new LakeData();
      entry.set("lakeName", lakeName);
      entry.set("sensorName", sensorName);
      entry.set("timestamp", new Date(record.timestamp));
      entry.set("value", parseFloat(record.value));
      entry.set("unit", unit);
      return entry;
    });

    try {
      await Parse.Object.saveAll(lakeDataEntries);
      return `Successfully uploaded ${lakeDataEntries.length} entries to LakeData class.`;
    } catch (error) {
      throw new Error("Failed to save entries: " + error.message);
    }
  });
}
