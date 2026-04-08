const express = require("express");
const cors = require("cors");
const path = require("path");

const productRoutes = require("./routes/productroutes");
const orderRoutes = require("./routes/orderroutes");
const userRoutes = require("./routes/userroutes");
const adminRoutes = require("./routes/adminroutes");

function createApp() {
  const app = express();
  const frontendPath = path.join(__dirname, "..", "frontend");
  const adminPath = path.join(__dirname, "..", "admin");

  app.use(cors());
  app.use(express.json());

  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);

  app.get(/^\/admin$/, (req, res) => {
    res.redirect(302, "/admin/");
  });

  app.get("/admin/", (req, res) => {
    res.sendFile(path.join(adminPath, "admin.html"));
  });

  app.use(express.static(frontendPath));
  app.use("/frontend", express.static(frontendPath));
  app.use(
    "/admin",
    express.static(adminPath, {
      index: false,
      redirect: false,
    })
  );

  app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });

  app.get("/health", (req, res) => {
    res.json({ ok: true, service: "ecommerce-api" });
  });

  return app;
}

module.exports = createApp;
