const crypto = require("crypto");

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || "novacart-admin-secret";
}

function encode(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function createAdminToken(user) {
  const payload = {
    sub: String(user._id),
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encodedPayload = encode(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = signPayload(encodedPayload);

  if (signature !== expectedSignature) {
    return null;
  }

  const payload = decode(encodedPayload);

  if (!payload.isAdmin || payload.exp <= Date.now()) {
    return null;
  }

  return payload;
}

module.exports = { createAdminToken, verifyAdminToken };
