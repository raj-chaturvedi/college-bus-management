const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All bus endpoints require authentication
router.use(requireAuth);

router.get('/', busController.getAllBuses);
router.get('/live', busController.getLiveBuses);
router.get('/:id', busController.getBusById);

// Admin-only endpoints
router.post('/', requireAdmin, busController.createBus);
router.put('/:id', requireAdmin, busController.updateBus);
router.put('/:id/occupancy', requireAdmin, busController.updateOccupancy);
router.delete('/:id', requireAdmin, busController.deleteBus);

module.exports = router;
