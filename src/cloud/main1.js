const axios = require("axios");

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
};

module.exports.init = init;
