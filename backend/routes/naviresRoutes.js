const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const naviresController = require('../controllers/naviresController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation pour la réception de navire
const receptionValidation = [
  body('nomNavire')
    .notEmpty()
    .trim()
    .withMessage('Le nom du navire est requis'),
  body('numeroIMO')
    .notEmpty()
    .trim()
    .withMessage('Le numéro IMO est requis'),
  body('dateArrivee')
    .isISO8601()
    .withMessage('Date d\'arrivée invalide'),
  body('cargaison')
    .isArray({ min: 1 })
    .withMessage('Au moins un produit dans la cargaison est requis'),
  body('cargaison.*.produit')
    .notEmpty()
    .withMessage('Le nom du produit est requis'),
  body('cargaison.*.quantite')
    .isFloat({ min: 0.01 })
    .withMessage('La quantité doit être supérieure à 0'),
  body('cargaison.*.origine')
    .notEmpty()
    .withMessage('L\'origine est requise'),
  body('documentsVerifies')
    .isBoolean()
    .equals('true')
    .withMessage('Les documents doivent être vérifiés'),
  body('qualiteVerifiee')
    .isBoolean()
    .equals('true')
    .withMessage('La qualité doit être vérifiée'),
  body('quantiteConfirmee')
    .isBoolean()
    .equals('true')
    .withMessage('La quantité doit être confirmée')
];

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET - Récupérer tous les navires
router.get('/', naviresController.getAllNavires);

// GET - Récupérer les navires avec dispatching par date
router.get('/suivi-tonnage', naviresController.getNaviresWithDispatchingByDate);

// GET - Récupérer les dispatches en attente
router.get('/dispatches/en-attente', naviresController.getDispatchesEnAttente);

// GET - Récupérer les dispatches récents
router.get('/dispatches/recents', naviresController.getDispatchesRecents);

// GET - Récupérer les rotations en transit
router.get('/rotations/en-transit', naviresController.getRotationsEnTransit);

// GET - Récupérer le stock total par magasin
router.get('/stock/magasin/:magasin_id', naviresController.getStockTotalParMagasin);

// POST - Créer une nouvelle réception (manager seulement)
router.post(
  '/reception',
  authorize('manager'),
  receptionValidation,
  naviresController.createReception
);

// POST - Dispatcher la cargaison (manager seulement)
router.post(
  '/:navireId/dispatch',
  authorize('manager'),
  naviresController.dispatchCargaison
);

module.exports = router;