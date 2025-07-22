# Plan d'amélioration de la sécurité - GESTION_STOCK_ITS_SN

## 🚨 Actions prioritaires (à faire immédiatement)

### 1. Sécurisation du JWT Secret
```javascript
// backend/server.js - Remplacer ligne 7
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}
```

### 2. Protection contre les injections SQL
```javascript
// backend/controllers/produitController.js - Sécuriser la recherche
const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
where[Op.or] = [
  { nom: { [Op.like]: `%${sanitizedSearch}%` } },
  { reference: { [Op.like]: `%${sanitizedSearch}%` } },
  { description: { [Op.like]: `%${sanitizedSearch}%` } }
];
```

### 3. Renforcer les mots de passe
```javascript
// backend/validation.js - Ajouter validation forte
const passwordSchema = {
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: 'Le mot de passe doit contenir au moins 8 caractères'
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      errorMessage: 'Le mot de passe doit contenir majuscules, minuscules, chiffres et caractères spéciaux'
    }
  }
};
```

### 4. Ajouter rate limiting sur l'authentification
```javascript
// backend/routes/authRoutes.js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes'
});

router.post('/login', loginLimiter, authController.login);
```

### 5. Sécuriser le stockage frontend
```javascript
// src/services/auth.js - Ne plus stocker les tokens dans localStorage
// Utiliser httpOnly cookies côté serveur
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials, {
    withCredentials: true // Pour les cookies httpOnly
  });
  // Ne pas stocker le token côté client
  return response.data;
};
```

## 📋 Améliorations à court terme

### 1. Configuration de production
```javascript
// backend/.env.production
NODE_ENV=production
JWT_SECRET=<générer avec: openssl rand -base64 32>
DB_PASSWORD=<mot de passe fort>
DB_USER=its_stock_user
SESSION_SECRET=<générer avec: openssl rand -base64 32>
```

### 2. Middleware de validation
```javascript
// backend/middleware/sanitizer.js
const sanitizeInput = (req, res, next) => {
  // Nettoyer récursivement tous les inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        // Échapper les caractères HTML
        obj[key] = obj[key].replace(/[<>]/g, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};
```

### 3. Logging sécurisé
```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Ne jamais logger les mots de passe ou tokens
const sanitizeLog = (data) => {
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.jwt;
  return sanitized;
};
```

### 4. Headers de sécurité
```javascript
// backend/server.js
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
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🔧 Améliorations architecturales

### 1. Séparation des environnements
```
├── config/
│   ├── development.js
│   ├── production.js
│   └── test.js
```

### 2. Gestion des sessions sécurisée
```javascript
// backend/config/session.js
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 30, // 30 minutes
    sameSite: 'strict'
  }
}));
```

### 3. API versioning
```javascript
// backend/routes/index.js
const v1Routes = require('./v1');
app.use('/api/v1', v1Routes);
```

### 4. Tests de sécurité automatisés
```json
// package.json
"scripts": {
  "security-check": "npm audit && snyk test",
  "test:security": "jest --testPathPattern=security"
}
```

## 📊 Métriques et monitoring

### 1. Monitoring des erreurs
```javascript
// backend/monitoring/sentry.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filtrer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  }
});
```

### 2. Audit des accès
```javascript
// backend/middleware/audit.js
const auditLog = async (req, res, next) => {
  const log = {
    timestamp: new Date(),
    user: req.user?.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  await AuditLog.create(log);
  next();
};
```

## ✅ Checklist de déploiement

- [ ] Générer et configurer JWT_SECRET fort
- [ ] Créer utilisateur MySQL dédié avec permissions limitées
- [ ] Activer HTTPS avec certificat SSL valide
- [ ] Configurer firewall pour limiter les accès
- [ ] Mettre en place backup automatique de la base de données
- [ ] Configurer monitoring et alertes
- [ ] Effectuer scan de vulnérabilités
- [ ] Documenter procédures de sécurité
- [ ] Former les utilisateurs aux bonnes pratiques
- [ ] Mettre en place politique de mots de passe

## 🔐 Bonnes pratiques à suivre

1. **Ne jamais commiter de secrets** - Utiliser .env et .gitignore
2. **Valider toutes les entrées** - Côté client ET serveur
3. **Chiffrer les données sensibles** - En transit et au repos
4. **Principes du moindre privilège** - Pour utilisateurs et processus
5. **Logs détaillés mais sécurisés** - Sans données sensibles
6. **Mises à jour régulières** - Dépendances et système
7. **Tests de sécurité** - Automatisés et manuels
8. **Documentation sécurité** - À jour et accessible

## 📞 Support

Pour toute question sur la sécurité, contacter l'équipe DevSecOps.