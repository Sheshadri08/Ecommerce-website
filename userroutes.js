const router = require("express").Router();
const User = require("../models/user");

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = await User.create({ email, password });
  return res.status(201).json({ id: user._id, email: user.email, isAdmin: user.isAdmin });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({ id: user._id, email: user.email, isAdmin: user.isAdmin });
});

module.exports = router;
