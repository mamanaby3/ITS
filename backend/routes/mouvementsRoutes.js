const express = require('express');
const router = express.Router();
const mouvementsController = require('../controllers/mouvementsController');
const { authenticate, checkMagasinAccess } = require('../middleware/auth-mysql');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET - Récupérer tous les mouvements (filtrés selon le rôle)
router.get('/', mouvementsController.getAllMouvements);

// POST - Créer un nouveau mouvement
router.post('/', 
  checkMagasinAccess,
  mouvementsController.createMouvement
);

module.exports = router;