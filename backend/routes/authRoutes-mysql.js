const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController-mysql');
const { authenticate } = require('../middleware/auth-mysql');

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation pour l'inscription
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom')
    .notEmpty()
    .trim()
    .withMessage('Le nom est requis'),
  body('prenom')
    .notEmpty()
    .trim()
    .withMessage('Le prénom est requis'),
  body('role')
    .isIn(['manager', 'operator'])
    .withMessage('Rôle invalide')
];

// Validation pour le changement de mot de passe
const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('Le nouveau mot de passe doit être différent de l\'ancien')
];

// Routes publiques
router.post('/login', loginValidation, authController.login);

// Routes protégées
router.use(authenticate); // Toutes les routes suivantes nécessitent une authentification

router.get('/me', authController.me);
router.post('/logout', authController.logout);
router.put('/password', updatePasswordValidation, authController.updatePassword);

// Route d'inscription (réservée aux managers)
router.post('/register', 
  authenticate,
  (req, res, next) => {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les managers peuvent créer des utilisateurs'
      });
    }
    next();
  },
  registerValidation, 
  authController.register
);

module.exports = router;