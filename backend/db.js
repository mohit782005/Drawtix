// =============================================================================
// db.js — MongoDB connection via Mongoose for Scribbl.io
// =============================================================================

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

/**
 * Connect to MongoDB Atlas
 * @returns {Promise<void>}
 */
async function connectDB() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "scribbl",
    });
    console.log("✅ Connected to MongoDB Atlas (scribbl)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("⚠️  MongoDB runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });
}

module.exports = { connectDB };
