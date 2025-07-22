const express = require('express');
const router = express.Router();
const rapportDispatchController = require('../controllers/rapportDispatchController');
const { authenticate, authorize } = require('../middleware/auth-mysql');

// Route pour le rapport dispatch vs entrées
router.get('/dispatch-vs-entrees', authenticate, rapportDispatchController.getRapportDispatchVsEntrees);

// Route pour le rapport des écarts par période (managers uniquement)
router.get('/ecarts-periode', authenticate, authorize('manager'), rapportDispatchController.getRapportEcartsParPeriode);

// Route pour le rapport de performance des magasins (managers uniquement)
router.get('/performance-magasins', authenticate, authorize('manager'), rapportDispatchController.getRapportPerformanceMagasins);

module.exports = router;