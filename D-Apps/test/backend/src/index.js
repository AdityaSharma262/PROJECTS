require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB().catch(err => {
  console.log('Continuing to start server without database connection...');
});

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Mount API routes
app.use('/api', require('./routes'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});