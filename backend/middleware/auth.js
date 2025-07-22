const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Accès non autorisé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ 
      where: { id: decoded.userId, actif: true },
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: require('../models').Magasin,
        as: 'magasin',
        attributes: ['id', 'nom']
      }]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non trouvé ou inactif' 
      });
    }

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

exports.checkMagasinAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Utilisateur non authentifié' 
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const magasinId = req.params.magasin_id || req.body.magasin_id || req.query.magasin_id;
  
  if (magasinId && req.user.magasin_id !== magasinId) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès refusé. Vous ne pouvez accéder qu\'à votre magasin.' 
    });
  }

  if (!magasinId && req.user.magasin_id) {
    req.body.magasin_id = req.user.magasin_id;
    req.query.magasin_id = req.user.magasin_id;
  }

  next();
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non authentifié' 
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permission) && !userPermissions.includes('all')) {
      return res.status(403).json({ 
        success: false, 
        error: `Permission refusée: ${permission}` 
      });
    }

    next();
  };
};