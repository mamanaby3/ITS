const express = require('express');
const router = express.Router();
const rotationController = require('../controllers/rotationController-mysql');
const { authenticate, authorize } = require('../middleware/auth-mysql');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes spécifiques d'abord
// Calculer le nombre de rotations nécessaires
router.post('/calculate', authorize('admin', 'operator', 'manager'), rotationController.calculateRotations);

// Créer plusieurs rotations en une fois
router.post('/multiple', authorize('admin', 'operator', 'manager'), rotationController.createMultipleRotations);

// Récupérer les rotations en transit
router.get('/en-transit', rotationController.getRotationsEnTransit);

// Récupérer l'historique des rotations
router.get('/history', rotationController.getRotationsHistory);

// Rapport des écarts
router.get('/ecarts', rotationController.getEcartsReport);

// Récupérer les rotations d'un dispatch
router.get('/dispatch/:dispatch_id', rotationController.getRotationsByDispatch);

// Routes générales ensuite
// Récupérer les rotations avec filtres
router.get('/', rotationController.getRotations);

// Créer une nouvelle rotation
router.post('/', authorize('admin', 'operator', 'manager'), rotationController.createRotation);

// Démarrer une rotation (la passer en transit)
router.post('/:rotation_id/start', authorize('admin', 'operator', 'manager'), rotationController.startRotation);

// Réceptionner une rotation (opérateurs uniquement)
router.post('/:rotation_id/receive', authorize('admin', 'operator'), rotationController.receiveRotation);

module.exports = router;