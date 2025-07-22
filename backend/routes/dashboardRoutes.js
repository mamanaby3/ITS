const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const dashboardMagasinierController = require('../controllers/dashboardMagasinierController');
const { authenticate } = require('../middleware/auth-mysql');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET - Statistiques du dashboard (filtrées selon le rôle)
router.get('/stats', dashboardController.getDashboardStats);

// GET - Navires en attente de dispatching
router.get('/navires-attente', dashboardController.getNaviresEnAttente);

// GET - Total réceptionné depuis la table navires
router.get('/total-receptionne', dashboardController.getTotalReceptionne);

// GET - Dashboard spécifique pour les magasiniers
router.get('/magasinier', dashboardMagasinierController.getDashboardMagasinier);

// GET - Statistiques détaillées pour les magasiniers
router.get('/magasinier/stats', dashboardMagasinierController.getStatsMagasinier);

module.exports = router;