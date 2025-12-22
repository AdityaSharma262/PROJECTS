const express = require('express');
const { createPrediction, getAllPredictions } = require('../controllers/matchPredictionController');

const router = express.Router();

// POST /predictions route
router.post('/', createPrediction);

// GET /predictions route
router.get('/', getAllPredictions);

module.exports = router;