const mongoose = require("mongoose");
const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function comparePassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(":")) {
    return false;
  }

  const [salt, storedHash] = storedPassword.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(hash, "hex"));
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function setPassword(password) {
  this.password = hashPassword(password);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return comparePassword(password, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    isAdmin: this.isAdmin,
  };
};

module.exports = mongoose.model("User", userSchema);
