const router = require("express").Router();
const User = require("../models/user");
const { createAdminToken } = require("../utils/auth");

function serializeAuth(user) {
  return {
    user: user.toPublicJSON(),
    token: user.isAdmin ? createAdminToken(user) : null,
  };
}

router.get("/bootstrap", async (req, res) => {
  const adminCount = await User.countDocuments({ isAdmin: true });
  return res.json({
    hasAdmin: adminCount > 0,
    defaultAdminEmail: process.env.ADMIN_EMAIL || "admin@novacart.local",
  });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = new User({
    name,
    email,
    isAdmin: false,
  });
  user.setPassword(password);
  await user.save();

  return res.status(201).json(serializeAuth(user));
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() });

  if (!user || !user.verifyPassword(password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json(serializeAuth(user));
});

module.exports = router;
