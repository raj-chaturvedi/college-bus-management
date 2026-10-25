const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { requireAuth } = require('../middleware/auth');

// Recommendations endpoint requires valid authenticated session
router.post('/', requireAuth, recommendationController.getRecommendations);

module.exports = router;
