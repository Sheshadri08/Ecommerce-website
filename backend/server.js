const createApp = require("./app");
const { connectToDatabase } = require("./db");
const { ensureBootstrapData } = require("./seeds");
const os = require("os");

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional for this project setup
}

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";
const app = createApp();

function getLocalNetworkUrl(port) {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return `http://${entry.address}:${port}`;
      }
    }
  }

  return null;
}

connectToDatabase()
  .then(async () => {
    await ensureBootstrapData();
    app.listen(PORT, HOST, () => {
      const localUrl = `http://localhost:${PORT}`;
      const networkUrl = getLocalNetworkUrl(PORT);

      console.log(`Server running on ${localUrl}`);

      if (networkUrl) {
        console.log(`Network access: ${networkUrl}`);
      }
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error.message);
    process.exit(1);
  });
