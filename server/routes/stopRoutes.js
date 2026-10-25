const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All bus stop endpoints require authentication
router.use(requireAuth);

router.get('/', stopController.getAllStops);

// Admin-only endpoints
router.post('/', requireAdmin, stopController.createStop);
router.put('/:id', requireAdmin, stopController.updateStop);
router.delete('/:id', requireAdmin, stopController.deleteStop);

module.exports = router;
