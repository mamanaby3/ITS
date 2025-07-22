require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import des contrôleurs MySQL
const authController = require('./controllers/authController-mysql');
const produitController = require('./controllers/produitController-mysql');
const clientController = require('./controllers/clientController-mysql');
const magasinController = require('./controllers/magasinController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Middleware d'authentification simple
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Accès non autorisé. Token manquant.' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '1UGVjL9bbqFo7GpL35ttj0R58H5zgKSw5voG3bLLwXU=');
    req.userId = decoded.userId;
    req.user = { id: decoded.userId, role: 'admin' }; // Simplification pour le test
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expiré' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      error: 'Token invalide' 
    });
  }
};

// Routes Auth (sans middleware)
app.post('/api/auth/login', authController.login);

// Routes Produits
app.get('/api/produits', authenticate, produitController.getAllProduits);
app.get('/api/produits/categories', authenticate, produitController.getCategories);
app.get('/api/produits/with-stock', authenticate, produitController.getProduitsWithStock);
app.get('/api/produits/stats', authenticate, produitController.getProduitsStats);
app.get('/api/produits/:id', authenticate, produitController.getProduitById);
app.post('/api/produits', authenticate, produitController.createProduit);
app.put('/api/produits/:id', authenticate, produitController.updateProduit);
app.delete('/api/produits/:id', authenticate, produitController.deleteProduit);

// Routes Clients
app.get('/api/clients', authenticate, clientController.getAllClients);
app.get('/api/clients/stats', authenticate, clientController.getClientsStats);
app.get('/api/clients/:id', authenticate, clientController.getClientById);
app.get('/api/clients/:id/stats', authenticate, clientController.getClientStats);
app.post('/api/clients', authenticate, clientController.createClient);
app.put('/api/clients/:id', authenticate, clientController.updateClient);
app.delete('/api/clients/:id', authenticate, clientController.deleteClient);

// Routes Magasins
app.get('/api/magasins', authenticate, magasinController.getAllMagasins);
app.get('/api/magasins/:id', authenticate, magasinController.getMagasinById);
app.get('/api/magasins/:id/stock', authenticate, magasinController.getMagasinStock);

// Routes Stock (simple)
app.get('/api/stock', authenticate, async (req, res) => {
  try {
    const { pool } = require('./config/database-mysql');
    const [stocks] = await pool.query(`
      SELECT 
        s.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        m.nom as magasin_nom
      FROM stock s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      ORDER BY m.nom, p.nom
    `);
    res.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Erreur stock:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Navires (simple)
app.get('/api/navires', authenticate, async (req, res) => {
  try {
    const { pool } = require('./config/database-mysql');
    const [navires] = await pool.query('SELECT * FROM navires ORDER BY date_arrivee DESC');
    res.json({ success: true, data: navires });
  } catch (error) {
    console.error('Erreur navires:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'MySQL'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Erreur serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur MySQL démarré sur le port ${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 URL Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});