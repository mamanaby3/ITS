require('dotenv').config();

// Vérifier les variables d'environnement critiques
if (!process.env.JWT_SECRET) {
  console.error('ERREUR: JWT_SECRET doit être défini dans les variables d\'environnement');
  process.exit(1);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const produitRoutes = require('./routes/produitRoutes');
const stockRoutes = require('./routes/stockRoutes');
const clientRoutes = require('./routes/clientRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const livraisonRoutes = require('./routes/livraisonRoutes');
const rapportRoutes = require('./routes/rapportRoutes');
const naviresRoutes = require('./routes/naviresRoutes');
const magasinRoutes = require('./routes/magasinRoutes');
const dispatchRoutes = require('./routes/dispatch');
const rotationRoutes = require('./routes/rotation');
const chauffeurRoutes = require('./routes/chauffeur');
const dispatchingRoutes = require('./routes/dispatching');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting - Plus permissif en développement
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes au lieu de 15
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // 1000 requêtes au lieu de 100
  message: {
    success: false,
    error: 'Trop de tentatives. Réessayez dans quelques minutes.',
    retryAfter: 5
  }
});

// Appliquer le rate limiting seulement en production ou sur des routes sensibles
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
} else {
  // En développement, rate limiting plus permissif seulement sur l'auth
  app.use('/api/auth/login', rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 tentatives par minute
    message: {
      success: false,
      error: 'Trop de tentatives de connexion. Réessayez dans 1 minute.'
    }
  }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/livraisons', livraisonRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/navires', naviresRoutes);
app.use('/api/magasins', require('./routes/magasinMysqlRoutes'));
app.use('/api/mouvements', require('./routes/mouvementsMysqlRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/dashboard-tonnage', require('./routes/dashboardTonnage-mysql'));
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/rotations', rotationRoutes);
app.use('/api/chauffeurs', chauffeurRoutes);
app.use('/api/navire-dispatching', require('./routes/navireDispatchingRoutes'));
app.use('/api/dispatching', dispatchingRoutes);
app.use('/api/stocks', require('./routes/stocksRoutes'));
app.use('/api/stock-magasinier', require('./routes/stockMagasinierRoutes'));
app.use('/api/operator', require('./routes/operator'));

// Test routes (temporary)
app.use('/api/test', require('./routes/testRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Ne pas synchroniser automatiquement la base de données
    // La synchronisation doit être faite manuellement via npm run init-db
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();