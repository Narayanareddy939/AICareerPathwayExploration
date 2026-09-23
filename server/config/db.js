const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_career_platform';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Warning: Could not establish live MongoDB connection (${error.message}). Running in hybrid dataset fallback mode.`);
    isConnected = false;
  }
};

const getStatus = () => ({
  connected: isConnected,
  readyState: mongoose.connection.readyState
});

module.exports = { connectDB, getStatus };
