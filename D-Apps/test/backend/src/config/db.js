const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    global.dbConnected = true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    global.dbConnected = false;
    throw error;
  }
};

module.exports = connectDB;