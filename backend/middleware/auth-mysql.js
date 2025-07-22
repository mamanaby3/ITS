const jwt = require('jsonwebtoken');
const db = require('../config/database-mysql');
require('dotenv').config();

// Middleware d'authentification
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Accès non autorisé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'its_maritime_stock_secret');
    
    // Récupérer l'utilisateur depuis la base de données
    const [users] = await db.execute(
      'SELECT id, email, nom, prenom, role, magasin_id FROM utilisateurs WHERE id = ? AND actif = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non trouvé ou inactif' 
      });
    }

    const user = users[0];
    req.userId = user.id;
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token invalide' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expiré' 
      });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur d\'authentification' 
    });
  }
};

// Middleware d'autorisation par rôle
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès refusé. Rôle insuffisant.' 
      });
    }

    next();
  };
};

// Vérifier l'accès au magasin
exports.checkMagasinAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Utilisateur non authentifié' 
    });
  }

  // Les managers ont accès à tous les magasins
  if (req.user.role === 'manager') {
    return next();
  }

  // Récupérer l'ID du magasin depuis différentes sources
  const magasinId = req.params.magasin_id || req.body.magasin_id || req.query.magasin_id;
  
  // Vérifier que l'opérateur accède uniquement à son magasin
  if (magasinId && req.user.magasin_id !== magasinId) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès refusé. Vous ne pouvez accéder qu\'à votre magasin.' 
    });
  }

  // Si pas de magasin spécifié, utiliser celui de l'utilisateur
  if (!magasinId && req.user.magasin_id) {
    req.body.magasin_id = req.user.magasin_id;
    req.query.magasin_id = req.user.magasin_id;
  }

  next();
};

// Vérifier une permission spécifique (basé sur le rôle pour cette app)
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      });
    }

    // Le manager a toutes les permissions
    if (req.user.role === 'manager') {
      return next();
    }

    // Mapping des permissions par rôle
    const rolePermissions = {
      'operator': [
        'stock.read', 'stock.create', 'stock.update',
        'produits.read', 'produits.create', 'produits.update',
        'clients.read', 'clients.create', 'clients.update',
        'commandes.read', 'commandes.create', 'commandes.update',
        'livraisons.read', 'livraisons.create', 'livraisons.update',
        'rapports.stock', 'rapports.export'
      ]
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        error: `Permission refusée: ${permission}` 
      });
    }

    next();
  };
};