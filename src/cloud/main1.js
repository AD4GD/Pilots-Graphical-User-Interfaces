const init = async () => {
  Parse.Cloud.define("getData", async (request) => {
    // const { param1, param2 } = request.params;

    const query = new Parse.Query("AD4GD_LakeMetaData");

    const results = await query.find();
    return results.map((item) => item.toJSON());
  });
};

module.exports.init = init;
