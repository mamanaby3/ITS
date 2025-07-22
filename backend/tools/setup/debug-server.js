require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const { validateLogin, handleValidationErrors } = require('./middleware/validation');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de logging détaillé
app.use((req, res, next) => {
  console.log(`\n🔵 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  next();
});

// Route de login avec logging à chaque étape
app.post('/api/auth/login',
  // Étape 1: Log avant validation
  (req, res, next) => {
    console.log('1️⃣ Avant validation');
    next();
  },
  
  // Étape 2: Validation
  validateLogin,
  
  // Étape 3: Log après validation
  (req, res, next) => {
    console.log('2️⃣ Après validation, avant handleValidationErrors');
    next();
  },
  
  // Étape 4: Gestion des erreurs de validation
  handleValidationErrors,
  
  // Étape 5: Log avant contrôleur
  (req, res, next) => {
    console.log('3️⃣ Après handleValidationErrors, avant contrôleur');
    next();
  },
  
  // Étape 6: Contrôleur avec wrapper pour catch les erreurs
  async (req, res, next) => {
    try {
      console.log('4️⃣ Dans le contrôleur');
      await authController.login(req, res);
    } catch (error) {
      console.error('❌ Erreur dans le contrôleur:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la connexion',
        details: error.message
      });
    }
  }
);

const PORT = 5003;
app.listen(PORT, () => {
  console.log(`🔍 Debug server running on port ${PORT}`);
  console.log('Test avec: curl -X POST http://localhost:5003/api/auth/login -H "Content-Type: application/json" -d \'{"email":"manager@its-senegal.com","password":"manager123"}\'');
});