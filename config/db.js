const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set. MongoDB connection skipped.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || undefined,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
