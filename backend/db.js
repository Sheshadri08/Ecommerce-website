const mongoose = require("mongoose");

const DEFAULT_URI = "mongodb://127.0.0.1:27017/novacart";

let connectionPromise = null;

function connectToDatabase() {
  if (!connectionPromise) {
    const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  return connectionPromise;
}

module.exports = { connectToDatabase };
