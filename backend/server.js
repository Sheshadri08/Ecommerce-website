const createApp = require("./app");
const { connectToDatabase } = require("./db");

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional for this project setup
}

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";
const app = createApp();

connectToDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error.message);
    process.exit(1);
  });
