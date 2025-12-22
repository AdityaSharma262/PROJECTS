const express = require('express');
const { getTokenBalance } = require('../controllers/tokenController');

const router = express.Router();

// GET /balance route
router.get('/balance', getTokenBalance);

module.exports = router;