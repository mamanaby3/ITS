const express = require('express');
const router = express.Router();
const chauffeurController = require('../controllers/chauffeurController-mysql');
const { authenticate, authorize } = require('../middleware/auth-mysql');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// CRUD pour les chauffeurs
router.post('/', authorize('admin', 'operator', 'manager'), chauffeurController.createChauffeur);
router.get('/', chauffeurController.getChauffeurs);
router.get('/:id', chauffeurController.getChauffeur);
router.put('/:id', authorize('admin', 'manager'), chauffeurController.updateChauffeur);
router.delete('/:id', authorize('admin'), chauffeurController.deleteChauffeur);

module.exports = router;