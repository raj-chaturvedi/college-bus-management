const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { requireAuth } = require('../middleware/auth');

// All service endpoints require authenticated session
router.use(requireAuth);

// Live Departure Board for any stop
router.get('/stop-board/:stopId', servicesController.getStopBoard);

// Digital QR Bus Pass Generator & Lifecycle
router.post('/passes', servicesController.generatePass);
router.get('/passes/my-passes', servicesController.getMyPasses);
router.get('/passes/verify/:code', servicesController.verifyPass);
router.post('/passes/consume/:code', servicesController.consumePass);

// Dynamic Traffic & Incident Reporting
router.post('/incidents', servicesController.reportIncident);
router.get('/incidents', servicesController.getIncidents);

module.exports = router;
