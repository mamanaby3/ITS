# Backend API - Système de Gestion de Stock ITS Sénégal

## 🚀 Installation et Configuration

### Prérequis
- Node.js (v14+)
- npm

### Installation
```bash
cd backend
npm install
```

### Configuration
Créer un fichier `.env` à la racine du backend (déjà fait) :
```env
NODE_ENV=development
PORT=5000
DB_DIALECT=sqlite
DB_NAME=its_stock.db
JWT_SECRET=its_senegal_stock_management_secret_key_2024
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Initialisation de la base de données
```bash
npm run init-db
```

### Démarrage du serveur
```bash
# Mode production
npm start

# Mode développement (avec rechargement automatique)
npm run dev
```

## 📋 Endpoints API

### Authentication
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/me` - Profil utilisateur
- `PUT /api/auth/password` - Changement de mot de passe

### Utilisateurs (Admin)
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Désactiver un utilisateur

### Produits
- `GET /api/produits` - Liste des produits
- `GET /api/produits/:id` - Détails d'un produit
- `POST /api/produits` - Créer un produit
- `PUT /api/produits/:id` - Modifier un produit
- `DELETE /api/produits/:id` - Désactiver un produit

### Stock
- `GET /api/stock/magasin/:magasin_id` - Stock par magasin
- `POST /api/stock/entree` - Entrée de stock
- `POST /api/stock/sortie` - Sortie de stock
- `POST /api/stock/transfert` - Transfert entre magasins
- `POST /api/stock/ajustement` - Ajustement d'inventaire
- `GET /api/stock/mouvements` - Historique des mouvements

### Clients
- `GET /api/clients` - Liste des clients
- `GET /api/clients/:id` - Détails d'un client
- `POST /api/clients` - Créer un client
- `PUT /api/clients/:id` - Modifier un client
- `DELETE /api/clients/:id` - Désactiver un client

### Commandes
- `GET /api/commandes` - Liste des commandes
- `GET /api/commandes/:id` - Détails d'une commande
- `POST /api/commandes` - Créer une commande
- `PUT /api/commandes/:id/status` - Modifier le statut
- `DELETE /api/commandes/:id` - Annuler une commande

### Livraisons
- `GET /api/livraisons` - Liste des livraisons
- `GET /api/livraisons/:id` - Détails d'une livraison
- `POST /api/livraisons` - Créer une livraison
- `PUT /api/livraisons/:id/status` - Modifier le statut
- `DELETE /api/livraisons/:id` - Annuler une livraison

### Rapports
- `GET /api/rapports/stock` - Rapport de stock
- `GET /api/rapports/mouvements` - Rapport des mouvements
- `GET /api/rapports/ventes` - Rapport des ventes
- `GET /api/rapports/valorisation` - Valorisation du stock
- `GET /api/rapports/activite` - Rapport d'activité

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Inclure le token dans les headers :
```
Authorization: Bearer <token>
```

## 👤 Comptes de test

- **Admin** : admin@its-senegal.com / admin123
- **Manager Dakar** : manager.dakar@its-senegal.com / manager123
- **Manager Thiès** : manager.thies@its-senegal.com / manager123

## 🏢 Magasins disponibles

- `dkr-port` - Entrepôt Principal Port (Dakar)
- `dkr-ind` - Entrepôt Zone Industrielle (Dakar)
- `thies` - Entrepôt Thiès
- `stl` - Entrepôt Saint-Louis

## 📝 Structure de la base de données

- **users** : Utilisateurs du système
- **magasins** : Points de stockage
- **produits** : Catalogue produits
- **stocks** : État des stocks par magasin
- **clients** : Base clients
- **commandes** : Commandes clients
- **livraisons** : Gestion des livraisons
- **mouvements_stock** : Traçabilité des mouvements

## 🧪 Tests

Pour tester l'API :
```bash
node test-api.js
```

## 📚 Technologies utilisées

- Express.js - Framework web
- Sequelize - ORM
- SQLite - Base de données
- JWT - Authentification
- bcrypt - Hashage des mots de passe
- Express Validator - Validation des données
- Helmet - Sécurité
- CORS - Cross-Origin Resource Sharing