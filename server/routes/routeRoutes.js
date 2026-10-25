const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All transit route endpoints require authentication
router.use(requireAuth);

router.get('/', routeController.getAllRoutes);
router.get('/:id', routeController.getRouteById);

// Admin-only endpoints
router.post('/', requireAdmin, routeController.createRoute);
router.put('/:id', requireAdmin, routeController.updateRoute);
router.delete('/:id', requireAdmin, routeController.deleteRoute);

module.exports = router;
