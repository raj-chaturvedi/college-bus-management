const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', alertController.getAlerts);

module.exports = router;
