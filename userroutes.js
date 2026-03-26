const router = require("express").Router();
const User = require("../models/User");

// Login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || user.password !== req.body.password) {
    return res.status(401).json("Invalid credentials");
  }

  res.json(user);
});

module.exports = router;