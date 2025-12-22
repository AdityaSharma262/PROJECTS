const express = require('express');
const router = express.Router();

// Main route
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running!' });
});

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Predictions routes
router.use('/predictions', require('./predictions'));

// Token routes
router.use('/token', require('./token'));

module.exports = router;