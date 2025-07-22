const express = require('express');
const router = express.Router();
const stockMagasinierController = require('../controllers/stockMagasinierController');
const { authenticate } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour la gestion du stock magasinier
router.get('/magasin/:magasinId/jour', stockMagasinierController.getStockJour);
router.post('/magasin/:magasinId/initialiser', stockMagasinierController.initialiserStockJour);
router.post('/magasin/:magasinId/entree', stockMagasinierController.enregistrerEntree);
router.post('/magasin/:magasinId/sortie', stockMagasinierController.enregistrerSortie);
router.get('/magasin/:magasinId/resume', stockMagasinierController.getResumeStock);
router.get('/magasin/:magasinId/historique', stockMagasinierController.getHistoriqueMouvements);

module.exports = router;