const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriverById);

// Admin-only endpoints
router.post('/', requireAdmin, driverController.createDriver);
router.put('/:id', requireAdmin, driverController.updateDriver);
router.delete('/:id', requireAdmin, driverController.deleteDriver);

module.exports = router;
