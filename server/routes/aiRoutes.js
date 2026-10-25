const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

// AI assistant endpoint requires valid authenticated session
router.post('/chat', requireAuth, aiController.chat);
router.post('/configure-key', requireAuth, aiController.configureKey);

module.exports = router;
