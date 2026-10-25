const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Admin only
router.get('/', verifyToken, requireRole('admin'), analyticsController.getAnalytics);

module.exports = router;
