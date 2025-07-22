require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Configuration de la base de données MySQL
const db = require('./config/database-mysql');

// Import des routes adaptées pour MySQL
const authRoutes = require('./routes/authRoutes-mysql');
const naviresRoutes = require('./routes/naviresRoutes');
const navireDispatchingRoutes = require('./routes/navireDispatchingRoutes');
const magasinRoutes = require('./routes/magasinRoutes');
const produitRoutes = require('./routes/produitRoutes');
const rapportDispatchRoutes = require('./routes/rapportDispatchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de base
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/navires', naviresRoutes);
app.use('/api/navire-dispatching', navireDispatchingRoutes);
app.use('/api/magasins', magasinRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/rapports-dispatch', rapportDispatchRoutes);

// Route de test de santé
app.get('/api/health', async (req, res) => {
  try {
    // Tester la connexion à la base de données
    await db.execute('SELECT 1');
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Route de test pour vérifier l'API
app.get('/api', (req, res) => {
  res.json({
    message: 'API ITS Maritime Stock',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      navires: '/api/navires',
      navireDispatching: '/api/navire-dispatching'
    }
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation',
      details: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Non autorisé'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur'
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Tester la connexion MySQL
    await db.execute('SELECT 1');
    console.log('✅ Connexion MySQL établie avec succès');
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt en cours...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu. Arrêt en cours...');
  process.exit(0);
});