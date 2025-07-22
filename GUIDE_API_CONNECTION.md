# Guide de connexion API - GESTION STOCK ITS SÉNÉGAL

## État actuel de la connexion

✅ **L'API est déjà configurée et connectée** dans votre application. Voici le récapitulatif :

### Frontend (React + Vite)
- **URL de base API** : `http://localhost:5000/api` (définie dans `src/utils/constants.js`)
- **Proxy Vite** : Configuré pour rediriger `/api` vers `http://localhost:5000`
- **Service API** : Axios configuré avec intercepteurs dans `src/services/api.js`

### Backend (Node.js + Express)
- **Port** : 5000
- **CORS** : Configuré pour accepter les requêtes de `http://localhost:3000`
- **Base de données** : SQLite (par défaut) ou MySQL
- **Authentification** : JWT

## Configuration requise

### 1. Variables d'environnement Frontend (.env)

Créez un fichier `.env` à la racine du projet :

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000
VITE_USE_MOCK_API=false
```

### 2. Variables d'environnement Backend (backend/.env)

Créez un fichier `.env` dans le dossier `backend/` :

```env
# Base de données (SQLite par défaut)
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Ou pour MySQL (XAMPP)
# DB_DIALECT=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=its_maritime_stock
# DB_USER=root
# DB_PASSWORD=

# Serveur
PORT=5000
NODE_ENV=development

# JWT (IMPORTANT: Générez un secret fort)
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Démarrage de l'application

### 1. Installation des dépendances

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Initialisation de la base de données

```bash
cd backend
npm run init-db
```

### 3. Lancer les serveurs

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

## Vérification de la connexion

1. **Backend actif** : Visitez http://localhost:5000/api/health
   - Réponse attendue : `{"status":"OK","timestamp":"...","environment":"development"}`

2. **Frontend actif** : Visitez http://localhost:3000
   - La page de connexion doit s'afficher

3. **Test de connexion** : Sur la page de login, utilisez :
   - Email : `admin@its-senegal.com`
   - Mot de passe : `Admin123!`

## Architecture de l'API

### Endpoints principaux

- **Authentification** : `/api/auth/*`
  - POST `/api/auth/login` - Connexion
  - POST `/api/auth/logout` - Déconnexion
  - GET `/api/auth/verify` - Vérification token

- **Gestion des stocks** : `/api/stock/*`
  - GET `/api/stock` - Liste des stocks
  - POST `/api/stock` - Créer un stock
  - PUT `/api/stock/:id` - Modifier un stock
  - DELETE `/api/stock/:id` - Supprimer un stock

- **Produits** : `/api/produits/*`
- **Clients** : `/api/clients/*`
- **Commandes** : `/api/commandes/*`
- **Livraisons** : `/api/livraisons/*`
- **Rapports** : `/api/rapports/*`

### Services API dans le Frontend

Tous les services sont dans `src/services/` :
- `api.js` : Configuration Axios de base
- `auth.js` : Authentification
- `stock.js` : Gestion des stocks
- `produits.js` : Gestion des produits
- `clients.js` : Gestion des clients
- etc.

## Dépannage

### Erreur de connexion API

1. **Vérifiez que le backend est lancé** :
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Vérifiez les logs du backend** pour les erreurs

3. **Vérifiez la configuration CORS** dans `backend/server.js`

4. **Vérifiez les variables d'environnement** dans les deux `.env`

### Erreur d'authentification

1. **Vérifiez le JWT_SECRET** dans `backend/.env`
2. **Videz le localStorage** du navigateur
3. **Réinitialisez la base de données** : `npm run init-db`

### Port déjà utilisé

Si le port 5000 est occupé :
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Mode développement vs Production

### Développement
- Proxy Vite actif
- CORS permissif
- Logs détaillés

### Production
- Build statique
- CORS restrictif
- Variables d'environnement sécurisées
- HTTPS recommandé

## Ressources

- Documentation des services API : `src/services/`
- Configuration des routes : `backend/routes/`
- Modèles de données : `backend/models/`
- Documentation Axios : https://axios-http.com/
- Documentation Express : https://expressjs.com/