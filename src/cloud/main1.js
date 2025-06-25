const axios = require("axios");
const mqtt = require("mqtt");

const cache = new Map();

const init = async () => {
  Parse.Cloud.define("getData", async (request) => {
    const query = new Parse.Query("AD4GD_LakeMetaData");

    const results = await query.find();
    return results.map((item) => item.toJSON());
  });

  Parse.Cloud.define("getConnectivity", async (request) => {
    const { time, properties } = request.params;
    const defaultTime = "2017-01-01";
    const defaultProperties = "Forest";
    const timeValue = time || defaultTime;
    const propertiesValue = properties || defaultProperties;

    // Create a unique cache key based on the parameters
    const cacheKey = `connectivity-${timeValue}-${propertiesValue}`;

    // Check if the response is already in the cache
    if (cache.has(cacheKey)) {
      return { status: "success", data: cache.get(cacheKey) };
    }

    // If not cached, fetch the image from the WMS server
    try {
      const response = await axios.get(
        `https://callus.ddns.net/cgi-bin/mmdc.py/collections/TerrestrialConnectivityIndex/coverage?subset=E(260000:528000),N(4488000:4748000),time("${timeValue}")&subset-crs=[EPSG:32631]&crs=[EPSG:32631]&properties=${propertiesValue}&f=TIFF`,
        {
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
          },
          responseType: "arraybuffer",
        }
      );

      // Convert arraybuffer to base64 string for transmission
      const base64Data = Buffer.from(response.data).toString("base64");

      // Cache the response
      cache.set(cacheKey, base64Data);

      return {
        status: "success",
        data: base64Data,
        contentType: "image/tiff",
      };
    } catch (error) {
      console.error("Error fetching or processing GeoTIFF:", error);
      throw new Parse.Error(
        Parse.Error.INTERNAL_SERVER_ERROR,
        "Error fetching or processing GeoTIFF"
      );
    }
  });

  Parse.Cloud.define("getMucsc", async (request) => {
    const { time } = request.params;
    const defaultTime = "2017-01-01";
    const timeValue = time || defaultTime;

    // Create a unique cache key based on the parameters
    const cacheKey = `mucsc-${timeValue}`;

    // Check if the response is already in the cache
    if (cache.has(cacheKey)) {
      return { status: "success", data: cache.get(cacheKey) };
    }

    // If not cached, fetch the image from the WMS server
    try {
      const response = await axios.get(
        `https://callus.ddns.net/cgi-bin/mmdc.py/collections/MUCSC/coverage?subset=E(260000:528000),N(4488000:4748000),time("${timeValue}")&subset-crs=[EPSG:32631]&crs=[EPSG:32631]&properties=classification&f=TIFF`,
        {
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
          },
          responseType: "arraybuffer",
        }
      );

      // Convert arraybuffer to base64 string for transmission
      const base64Data = Buffer.from(response.data).toString("base64");

      // Cache the response
      cache.set(cacheKey, base64Data);

      return {
        status: "success",
        data: base64Data,
        contentType: "image/tiff",
      };
    } catch (error) {
      console.error("Error fetching or processing GeoTIFF:", error);
      throw new Parse.Error(
        Parse.Error.INTERNAL_SERVER_ERROR,
        "Error fetching or processing GeoTIFF"
      );
    }
  });

  Parse.Cloud.define("addFavouriteLake", async (request) => {
    const { lakeId, notes } = request.params;
    const user = request.user;

    // Check if already favorited this lake
    const existing = await new Parse.Query("AD4GD_FavouriteLake")
      .equalTo("user", user)
      .equalTo("lake", new Parse.Object("Lake", { id: lakeId }))
      .first();

    if (existing) {
      throw "You already favorited this lake!";
    }

    const FavouriteLake = Parse.Object.extend("AD4GD_FavouriteLake");
    const favourite = new FavouriteLake();
    favourite.set("user", user);
    favourite.set("lake", new Parse.Object("Lake", { id: lakeId }));
    favourite.set("notes", notes || "");

    return favourite.save();
  });

  Parse.Cloud.define("getFavouriteLakes", async (request) => {
    const user = request.user;
    const query = new Parse.Query("AD4GD_FavouriteLake")
      .equalTo("user", user)
      .include("lake");

    const results = await query.find();

    return results.map((fav) => ({
      id: fav.id,
      lake: fav.get("lake").toJSON(),
      notes: fav.get("notes"),
    }));
  });
  Parse.Cloud.define("importLakeData", async (request) => {
    try {
      // Log all received parameters for debugging
      console.log(
        "Received parameters:",
        JSON.stringify(request.params, null, 2)
      ); // Get parameters from request with fallbacks
      let {
        csvData, // CSV data as string, sent from frontend
        lakeName = request.params.lake, // Name of the lake
        lakeId, // ObjectId of the lake
        valueType = request.params.type, // Type of measurement (Water Level, Temperature, etc.)
        source = "ad4gd_lakes", // Source of the data (default: ad4gd_lakes)
        valueUnit = request.params.unit, // Unit of measurement (cm, °C, etc.)
        isPublic = true, // Whether the data is public or private
      } = request.params;

      // If any of these are still undefined, try to extract them from other fields
      if (!lakeName && request.params.sensorName) {
        // Try to extract from sensorName (if it contains lake name)
        const parts = request.params.sensorName.split(" ");
        if (parts.length > 1) {
          lakeName = parts[0];
        }
      }

      if (!valueType && request.params.sensorName) {
        // Try to extract from sensorName (if it contains value type)
        const parts = request.params.sensorName.split(" ");
        if (parts.length > 1) {
          valueType = parts.slice(1).join(" ");
        }
      } // Log each parameter status
      console.log("Parameter checks:", {
        csvData: !!csvData,
        lakeName: !!lakeName,
        lakeId: !!lakeId,
        valueType: !!valueType,
        source: !!source,
        valueUnit: !!valueUnit,
        isPublic: !!isPublic,
      });

      if (!csvData || !lakeName || !valueType || !source || !valueUnit) {
        const missingParams = [];
        if (!csvData) missingParams.push("csvData");
        if (!lakeName) missingParams.push("lakeName");
        if (!valueType) missingParams.push("valueType");
        if (!source) missingParams.push("source");
        if (!valueUnit) missingParams.push("valueUnit");

        console.error("Missing parameters:", missingParams);
        throw new Error(
          "Missing required parameters: " + missingParams.join(", ")
        );
      }

      // Auto-generate sensorName and sensorId
      const cleanLakeName = lakeName.replace(/\s+/g, " ").trim();
      const cleanValueType = valueType.replace(/\s+/g, " ").trim();

      // Format sensor name and ID
      const sensorName = `${cleanLakeName} ${cleanValueType}`;
      const sensorId = `sensor_${cleanLakeName
        .replace(/\s+/g, "")
        .toLowerCase()}_${cleanValueType.replace(/\s+/g, "").toLowerCase()}`; // Log the generated values
      console.log(`Generated sensorName: ${sensorName}`);
      console.log(`Generated sensorId: ${sensorId}`);
      console.log(`Using lakeId: ${lakeId}`);

      // Update MIAAS_Geographies with the new sensor
      try {
        // Query for the lake by ID first (if provided) or by label as fallback
        const Geography = Parse.Object.extend("MIAAS_Geographies");
        const query = new Parse.Query(Geography);

        if (lakeId) {
          // If we have the lake ID, use it for precise lookup
          console.log(`Looking up lake by ID: ${lakeId}`);
          query.equalTo("objectId", lakeId);
        } else {
          // Fallback to label search if no ID provided
          query.equalTo("label", cleanLakeName);
        }

        // Get the lake object
        const lake = await query.first({ useMasterKey: true });

        if (!lake) {
          console.warn(
            `Lake with name "${cleanLakeName}" not found in MIAAS_Geographies.`
          );
        } else {
          // Get the current sensors array
          let sensors = lake.get("sensors") || [];

          // Create the new sensor entry in the required format
          const newSensor = [source, sensorId, 0];

          // Check if this sensor already exists to avoid duplicates
          const sensorExists = sensors.some(
            (sensor) =>
              Array.isArray(sensor) &&
              sensor.length >= 2 &&
              sensor[0] === source &&
              sensor[1] === sensorId
          );

          if (!sensorExists) {
            // Append the new sensor to the sensors array
            sensors.push(newSensor);

            // Update the lake object with the modified sensors array
            lake.set("sensors", sensors);

            // Save the changes
            await lake.save(null, { useMasterKey: true });
            console.log(`Added sensor ${sensorId} to lake ${cleanLakeName}`);
          } else {
            console.log(
              `Sensor ${sensorId} already exists for lake ${cleanLakeName}`
            );
          }
        }
      } catch (error) {
        console.error(`Error updating MIAAS_Geographies: ${error.message}`);
        // Continue with the import process even if geography update fails
      }

      // Process the CSV data
      const processedRows = parseCSVData(csvData);

      // Connect to MQTT and send data
      const result = await sendDataToMQTT(
        processedRows,
        sensorName,
        sensorId,
        source,
        valueType,
        valueUnit
      );

      return {
        success: true,
        message: `Successfully processed ${result.processedCount} data points for ${sensorName}`,
        processedCount: result.processedCount,
        sensorId: sensorId,
      };
    } catch (error) {
      console.error("Error in importLakeData cloud function:", error);
      throw new Error(`Failed to import data: ${error.message}`);
    }
  });

  // Function to parse CSV data from string
  function parseCSVData(csvString) {
    const rows = [];
    const lines = csvString.split("\n");

    // Skip header row if present
    const startIndex = lines[0].includes(";") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(";");
      if (parts.length >= 2) {
        const timestamp = convertToTimestamp(parts[0]);
        let value = parts[1].replace(",", "."); // Replace comma with period for decimal
        value = parseFloat(value);

        if (timestamp && !isNaN(value)) {
          rows.push({ timestamp, value });
        }
      }
    }

    return rows;
  }

  // Function to convert date-time string to timestamp
  function convertToTimestamp(dateTimeString) {
    try {
      // Remove any quotes that might be in the string
      const cleanDateTime = dateTimeString.replace(/"/g, "");

      // Check if we have both date and time parts
      if (cleanDateTime.includes(" ")) {
        const [date, time] = cleanDateTime.split(" ");
        const [day, month, year] = date.split(".");

        // Check if time part exists and contains hour and minute
        if (time && time.includes(":")) {
          const [hour, minute] = time.split(":");
          return new Date(year, month - 1, day, hour, minute).getTime();
        } else {
          // If no time or invalid time, default to 00:00
          return new Date(year, month - 1, day, 0, 0).getTime();
        }
      } else {
        // If only date is provided (no space for time part)
        const [day, month, year] = cleanDateTime.split(".");
        return new Date(year, month - 1, day, 0, 0).getTime();
      }
    } catch (error) {
      console.error(`Error parsing date-time string: ${dateTimeString}`, error);
      return null; // Return null for invalid dates
    }
  }

  // Function to send data to MQTT
  async function sendDataToMQTT(
    rows,
    sensorName,
    sensorId,
    source,
    valueType,
    valueUnit
  ) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Attempting to connect to MQTT broker...`);

        // Connection options
        const options = {
          clientId: `mqtt_client_${Math.random().toString(16).slice(2, 8)}`,
          clean: true,
          connectTimeout: 30000,
          reconnectPeriod: 5000,
          username: "admin",
          password: "JMRSqp2iyJk4sM",
          rejectUnauthorized: false,
          keepalive: 60,
        };

        // Connect to MQTT broker
        const client = mqtt.connect("mqtt://193.175.161.182:1883", options);

        let processedCount = 0;
        let hasError = false;

        client.on("connect", async () => {
          console.log(`Connected to MQTT broker for ${sensorName}`);

          try {
            // Process each row sequentially
            for (const row of rows) {
              if (hasError) break;

              await sendItemToMQTT(
                client,
                row.timestamp,
                row.value,
                sensorName,
                sensorId,
                source,
                valueType,
                valueUnit
              );
              processedCount++;

              // Add a delay between messages to avoid overwhelming the broker
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // Close connection after all data is sent
            setTimeout(() => {
              client.end(true, () => {
                console.log(
                  `MQTT connection closed after processing ${processedCount} items`
                );
                resolve({ processedCount });
              });
            }, 2000);
          } catch (error) {
            hasError = true;
            client.end(true);
            reject(error);
          }
        });

        client.on("error", (error) => {
          console.error("MQTT connection error:", error);
          hasError = true;

          // Try alternate connection methods
          tryAlternativeConnection(
            rows,
            sensorName,
            sensorId,
            source,
            valueType,
            valueUnit
          )
            .then((result) => resolve(result))
            .catch((err) => reject(err));
        });
      } catch (error) {
        console.error("sendDataToMQTT Error:", error);
        reject(error);
      }
    });
  }

  // Function to try alternative connection methods
  async function tryAlternativeConnection(
    rows,
    sensorName,
    sensorId,
    source,
    valueType,
    valueUnit
  ) {
    return new Promise((resolve, reject) => {
      try {
        console.log("Trying alternative connection methods...");

        const options = {
          clientId: `mqtt_client_${Math.random().toString(16).slice(2, 8)}`,
          clean: true,
          connectTimeout: 30000,
          reconnectPeriod: 5000,
          username: "admin",
          password: "JMRSqp2iyJk4sM",
          rejectUnauthorized: false,
          keepalive: 60,
        };

        // Try secure MQTT as fallback
        const client = mqtt.connect("mqtts://193.175.161.182:8883", options);

        let processedCount = 0;
        let hasError = false;

        client.on("connect", async () => {
          console.log("Connected to MQTT broker using secure port");

          try {
            // Process each row sequentially
            for (const row of rows) {
              if (hasError) break;

              await sendItemToMQTT(
                client,
                row.timestamp,
                row.value,
                sensorName,
                sensorId,
                source,
                valueType,
                valueUnit
              );
              processedCount++;

              // Add a delay between messages to avoid overwhelming the broker
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // Close connection after all data is sent
            setTimeout(() => {
              client.end(true, () => {
                console.log(
                  `MQTT connection closed after processing ${processedCount} items`
                );
                resolve({ processedCount });
              });
            }, 2000);
          } catch (error) {
            hasError = true;
            client.end(true);
            reject(error);
          }
        });

        client.on("error", (error) => {
          console.error("Secure connection error:", error);
          console.log("Attempting WebSocket connection...");

          // Finally try WebSocket connection as last resort
          const wsClient = mqtt.connect("ws://193.175.161.182:9001", options);

          let wsProcessedCount = 0;
          let wsHasError = false;

          wsClient.on("connect", async () => {
            console.log("Connected to MQTT broker via WebSocket");

            try {
              // Process each row sequentially
              for (const row of rows) {
                if (wsHasError) break;

                await sendItemToMQTT(
                  wsClient,
                  row.timestamp,
                  row.value,
                  sensorName,
                  sensorId,
                  source,
                  valueType,
                  valueUnit
                );
                wsProcessedCount++;

                // Add a delay between messages to avoid overwhelming the broker
                await new Promise((resolve) => setTimeout(resolve, 500));
              }

              // Close connection after all data is sent
              setTimeout(() => {
                wsClient.end(true, () => {
                  console.log(
                    `WebSocket MQTT connection closed after processing ${wsProcessedCount} items`
                  );
                  resolve({ processedCount: wsProcessedCount });
                });
              }, 2000);
            } catch (error) {
              wsHasError = true;
              wsClient.end(true);
              reject(error);
            }
          });

          wsClient.on("error", (wsError) => {
            console.error("WebSocket connection error:", wsError);
            console.log("All connection attempts failed.");
            reject(new Error("All MQTT connection attempts failed"));
          });
        });
      } catch (error) {
        console.error("Alternative connection attempt failed:", error);
        reject(error);
      }
    });
  }

  // Function to send a single item to MQTT
  function sendItemToMQTT(
    client,
    timestamp,
    value,
    sensorName,
    sensorId,
    source,
    valueType,
    valueUnit
  ) {
    return new Promise((resolve, reject) => {
      const itemObject = createItem(
        timestamp,
        value,
        sensorName,
        sensorId,
        source,
        valueType,
        valueUnit
      );
      client.publish("ad4gd", itemObject, { qos: 1 }, (err) => {
        if (err) {
          console.error("Sent Item Error ", err);
          reject(err);
        } else {
          console.log(`Sent Item to MQTT: ${sensorName}, value: ${value}`);
          resolve();
        }
      });
    });
  }

  // Function to create an item object
  function createItem(
    timestamp,
    value,
    sensorName,
    sensorId,
    source,
    valueType,
    valueUnit
  ) {
    const parsedTime = timestamp; // Timestamp should already be in milliseconds
    const item = {
      id: sensorId,
      name: sensorName,
      source: source,
      valueTypes: [{ name: valueType, unit: valueUnit, type: "Number" }],
      values: [{ date: parsedTime, value: [parseFloat(value)] }],
    };
    return JSON.stringify(item);
  }

  Parse.Cloud.define("processBioconnTiff", async (request) => {
    console.log("[BioConn] Function started");
    const { type, mode, fileData } = request.params; // Log parameters without the actual file content
    console.log(
      `[BioConn] Received params: type='${type}', mode='${mode}', fileData=${
        fileData
          ? `${fileData.substring(0, 20)}... (${fileData.length} bytes)`
          : "undefined"
      }`
    );

    if (!type || !mode || !fileData) {
      console.log("[BioConn] Error: Missing required parameters");
      throw new Parse.Error(
        Parse.Error.INVALID_PARAMETER,
        "Missing required parameters: type, mode, or fileData"
      );
    }

    // Validate type parameter
    const validTypes = [
      "aquatic",
      "forest",
      "woody",
      "shrublands",
      "herbaceous",
    ];

    console.log(
      `[BioConn] Validating type parameter '${type}' against valid types:`,
      validTypes
    );

    if (!validTypes.includes(type)) {
      console.log(`[BioConn] Error: Invalid type parameter: ${type}`);
      throw new Parse.Error(
        Parse.Error.INVALID_PARAMETER,
        `Invalid type parameter '${type}'. Must be one of: ${validTypes.join(
          ", "
        )}`
      );
    }

    console.log(`[BioConn] Type parameter '${type}' is valid`);

    // Validate mode parameter
    const validModes = ["high", "low"];
    if (!validModes.includes(mode)) {
      console.log(`[BioConn] Error: Invalid mode parameter: ${mode}`);
      throw new Parse.Error(
        Parse.Error.INVALID_PARAMETER,
        `Invalid mode parameter. Must be one of: ${validModes.join(", ")}`
      );
    }
    try {
      console.log("[BioConn] Step 1: Preparing request to BioConn API");
      // Create a FormData-like object for the multipart/form-data request
      const FormData = require("form-data");
      const form = new FormData();

      // Convert base64 string back to buffer
      const fileBuffer = Buffer.from(fileData, "base64");
      console.log(`[BioConn] File buffer created: ${fileBuffer.length} bytes`);

      if (!fileBuffer || fileBuffer.length === 0) {
        console.log("[BioConn] Error: Failed to create file buffer");
        throw new Error("Failed to create file buffer from base64 data");
      }

      // Add the file to the form
      form.append("file", fileBuffer, {
        filename: "upload.tiff",
        contentType: "image/tiff",
      });
      console.log("[BioConn] File appended to form data");

      // Log the start time for debugging timeout issues
      const startTime = Date.now();
      console.log(
        `[BioConn] Request starting at: ${new Date(startTime).toISOString()}`
      );
      console.log(
        `[BioConn] Step 2: Sending request to API endpoint (type=${type}, mode=${mode})`
      );
      console.log(
        `[BioConn] Full API URL: https://pilot2api.dashboard-siba.store/bioconn/?type=${type}&mode=${mode}`
      );

      // Make the request to the bioconn API with an extended timeout
      const response = await axios.post(
        `https://pilot2api.dashboard-siba.store/bioconn/?type=${type}&mode=${mode}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Accept: "image/tiff,*/*",
          },
          responseType: "arraybuffer",
          timeout: 1200000, // 20 minute timeout for handling larger files (10-20MB)
        }
      );

      // Calculate and log the request duration
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // in seconds
      console.log(
        `[BioConn] Request completed in ${duration.toFixed(2)} seconds (${(
          duration / 60
        ).toFixed(2)} minutes)`
      );
      console.log(
        `[BioConn] Step 3: Response received (Status: ${response.status})`
      );
      console.log(
        `[BioConn] Response data size: ${
          response.data ? `${response.data.byteLength} bytes` : "No data"
        }`
      );

      // Check if the response is actually a GeoTIFF by examining the header
      // TIFF files typically start with "49 49 2A 00" (little-endian) or "4D 4D 00 2A" (big-endian)
      if (response.data && response.data.byteLength > 4) {
        const header = Buffer.from(response.data.slice(0, 4));
        const headerHex = Array.from(header)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        console.log("[BioConn] Response header (hex):", headerHex);

        const isTiff = headerHex === "49492a00" || headerHex === "4d4d002a";
        if (!isTiff) {
          console.log(
            "[BioConn] Warning: Response does not appear to be a valid TIFF"
          );

          try {
            // Try to decode as text to see if it's an error message
            const textContent = Buffer.from(response.data)
              .toString("utf8")
              .substring(0, 200);
            console.log(
              "[BioConn] Response as text (first 200 chars):",
              textContent
            );
          } catch (e) {
            console.log(
              "[BioConn] Could not decode response as text:",
              e.message
            );
          }
        } else {
          console.log("[BioConn] Response is a valid TIFF format");
        }
      }

      // Additional metadata extraction for debugging purposes
      if (response.data && response.data.byteLength > 0) {
        try {
          // Try to extract basic TIFF structure info for the client
          const GeoTIFF = require("geotiff");
          console.log("[BioConn] Checking TIFF structure on server...");

          const tiff = await GeoTIFF.fromArrayBuffer(response.data);
          const imageCount = await tiff.getImageCount();
          const firstImage = await tiff.getImage();
          const metadata = firstImage.getFileDirectory();

          console.log("[BioConn] TIFF structure summary:", {
            imageCount,
            width: metadata.ImageWidth,
            height: metadata.ImageLength,
            hasTileInfo: !!metadata.TileWidth,
            hasBitsPerSample: !!metadata.BitsPerSample,
            hasSampleFormat: !!metadata.SampleFormat,
            hasGeoKeys: !!metadata.GeoKeyDirectory,
            hasModelTiepoints: !!metadata.ModelTiepointTag,
            hasModelPixelScale: !!metadata.ModelPixelScaleTag,
          });
        } catch (error) {
          console.log(
            "[BioConn] Failed to extract TIFF metadata on server:",
            error.message
          );
        }
      }

      // Convert the response back to base64 for transmission
      const responseData = Buffer.from(response.data).toString("base64");
      console.log(
        `[BioConn] Converted response to base64 (${responseData.length} chars)`
      );
      console.log("[BioConn] Function completed successfully"); // Include content type information in the response
      const contentType = response.headers["content-type"] || "image/tiff";
      console.log(`[BioConn] Response content type: ${contentType}`);

      // Create the response object with basic info
      const responseObj = {
        status: "success",
        data: responseData,
        contentType: contentType,
        fileSize: response.data ? response.data.byteLength : 0,
        metadata: {},
      };

      // Try to include metadata if we extracted it
      try {
        const GeoTIFF = require("geotiff");
        const tiff = await GeoTIFF.fromArrayBuffer(response.data);
        const firstImage = await tiff.getImage();
        const metadata = firstImage.getFileDirectory();

        responseObj.metadata = {
          width: metadata.ImageWidth,
          height: metadata.ImageLength,
          hasTileInfo: !!metadata.TileWidth,
          hasBitsPerSample: !!metadata.BitsPerSample,
          hasSampleFormat: !!metadata.SampleFormat,
          hasGeoKeys: !!metadata.GeoKeyDirectory,
          hasModelTransform: !!(
            metadata.ModelTiepointTag || metadata.ModelPixelScaleTag
          ),
        };
      } catch (e) {
        console.log(
          "[BioConn] Could not extract metadata for response:",
          e.message
        );
      }

      return responseObj;
    } catch (error) {
      console.log("[BioConn] Error occurred during processing");

      let errorMessage = "Error processing TIFF file";
      if (error.name) {
        errorMessage = `${error.name}: ${error.message}`;
        console.log(`[BioConn] Error type: ${error.name}`);
      }
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(
          `[BioConn] Server responded with status ${error.response.status}`
        );
        console.log(`[BioConn] Response headers:`, error.response.headers);

        errorMessage = `Server responded with status ${error.response.status}`;

        // If we have response data, try to convert it to string for more context
        if (error.response.data) {
          try {
            const dataStr = Buffer.from(error.response.data).toString();
            // Log the full error response for debugging aquatic parameter issues
            console.log(`[BioConn] Full error response: ${dataStr}`);

            // Check if the error specifically mentions unsupported type
            if (
              dataStr.toLowerCase().includes("aquatic") ||
              dataStr.toLowerCase().includes("not supported") ||
              dataStr.toLowerCase().includes("invalid type")
            ) {
              console.log(
                `[BioConn] IMPORTANT: API rejected the 'aquatic' parameter. Error response: ${dataStr}`
              );
            }

            errorMessage += `: ${dataStr.substring(0, 500)}`; // Include a reasonable amount in the error
          } catch (e) {
            // Ignore conversion errors
            console.log("[BioConn] Could not convert response data to string");
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log("[BioConn] No response received from server");
        errorMessage = "No response received from server";
      } else {
        // Something happened in setting up the request
        console.log(`[BioConn] Request setup error: ${error.message}`);
        errorMessage = error.message;
      }

      console.log(`[BioConn] Function failed: ${errorMessage}`);
      throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, errorMessage);
    }
  });
};

module.exports.init = init;
