const { verifyAdminToken } = require("../utils/auth");

function adminAuth(req, res, next) {
  const headerValue = req.headers.authorization || req.headers["x-admin-token"] || "";
  const token = headerValue.startsWith("Bearer ") ? headerValue.slice(7) : headerValue;
  const payload = verifyAdminToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  req.admin = payload;
  return next();
}

module.exports = adminAuth;
