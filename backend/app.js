const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/productroutes");
const orderRoutes = require("./routes/orderroutes");
const userRoutes = require("./routes/userroutes");
const adminRoutes = require("./routes/adminroutes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(express.static(path.join(__dirname, "..", "frontend")));
  app.use("/admin", express.static(path.join(__dirname, "..", "admin")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
  });

  app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "admin", "admin.html"));
  });

  app.get("/health", (req, res) => {
    res.json({ ok: true, service: "ecommerce-api" });
  });

  return app;
}

module.exports = createApp;
