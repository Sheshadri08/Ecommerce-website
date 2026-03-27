const createApp = require("./app");

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional for this project setup
}

const PORT = Number(process.env.PORT || 5000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
