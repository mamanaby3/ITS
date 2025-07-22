const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authMysqlController');
const { authenticate } = require('../middleware/auth-mysql');
const { 
  loginValidation, 
  registerValidation, 
  passwordValidation,
  handleValidationErrors 
} = require('../middleware/validation');

// Rate limiting pour la connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'inscription
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 inscriptions maximum par heure
  message: 'Trop de tentatives d\'inscription. Réessayez dans une heure.',
});

router.post('/login',
  loginLimiter,
  loginValidation(),
  handleValidationErrors,
  authController.login
);

router.post('/register',
  registerLimiter,
  registerValidation(),
  handleValidationErrors,
  authController.register
);

router.get('/me', 
  authenticate,
  authController.me
);

router.put('/password',
  authenticate,
  passwordValidation(),
  handleValidationErrors,
  authController.updatePassword
);

module.exports = router;