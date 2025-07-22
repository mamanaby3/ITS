const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const magasinController = require('../controllers/magasinController');
const { authenticate } = require('../middleware/auth-mysql');

// Validation pour la création/mise à jour d'un magasin
const magasinValidation = [
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('ville').notEmpty().withMessage('La ville est requise'),
  body('id').optional().matches(/^[a-z0-9-]+$/).withMessage('ID invalide (lettres minuscules, chiffres et tirets uniquement)')
];

// Routes
router.get('/', authenticate, magasinController.getAllMagasins);
router.get('/:id', authenticate, magasinController.getMagasinById);
router.get('/:id/stock', authenticate, magasinController.getMagasinStock);
router.post('/', authenticate, magasinValidation, magasinController.createMagasin);
router.put('/:id', authenticate, magasinValidation, magasinController.updateMagasin);
router.delete('/:id', authenticate, magasinController.deleteMagasin);

module.exports = router;