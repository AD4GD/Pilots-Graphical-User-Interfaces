require("dotenv").config();

const envConfig = {
  publicServerURL: process.env.PARSE_PUBLIC_SERVER_URL,
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY,
};

module.exports = envConfig;
