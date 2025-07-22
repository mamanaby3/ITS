# Analyse du Code - Application de Gestion de Stock ITS Sénégal

## Vue d'ensemble

Application web de gestion de stock maritime développée avec une architecture moderne full-stack.

## Architecture Technique

### Backend (Node.js/Express)
- **Framework** : Express.js avec architecture REST
- **Base de données** : MySQL avec Sequelize ORM
- **Authentification** : JWT (JSON Web Tokens) avec bcrypt
- **Sécurité** : Helmet, CORS, rate limiting
- **Structure** : Pattern MVC (Modèles, Vues, Contrôleurs)

### Frontend (React/Vite)
- **Framework** : React 18 avec Vite
- **Routing** : React Router v6
- **État global** : Context API pour l'authentification
- **Requêtes API** : TanStack Query (React Query)
- **Styles** : Tailwind CSS
- **UI Components** : Composants custom modulaires

## Structure du Projet

```
GESTION_STOCK_ITS_SN/
├── backend/
│   ├── config/          # Configuration base de données
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Auth, validation
│   ├── models/         # Modèles Sequelize
│   ├── routes/         # Points d'entrée API
│   └── scripts/        # Scripts de maintenance
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── context/        # Contextes React (Auth, Stock, Theme)
│   ├── hooks/          # Hooks personnalisés
│   ├── pages/          # Pages de l'application
│   ├── services/       # Services API
│   └── utils/          # Utilitaires
```

## Modèles de Données

### 1. **User** (Utilisateurs)
- `id` : Identifiant unique
- `email` : Email unique
- `password_hash` : Mot de passe hashé
- `nom`, `prenom` : Identité
- `role` : 'admin', 'manager', 'operator'
- `magasin_id` : Magasin assigné
- `permissions` : JSON des permissions
- `actif` : Statut actif/inactif

### 2. **Magasin** (Entrepôts)
- Gestion multi-sites
- Lié aux utilisateurs, stocks, clients

### 3. **Produit**
- `reference` : Référence unique
- `nom` : Nom du produit
- `categorie` : Catégorie
- `prix_unitaire` : Prix
- `seuil_alerte` : Seuil d'alerte stock

### 4. **Stock**
- `produit_id` : Produit concerné
- `magasin_id` : Magasin
- `quantite` : Quantité disponible
- `quantite_reservee` : Quantité réservée
- `lot_number` : Numéro de lot
- `emplacement` : Localisation

### 5. **Commande**
- `numero` : Numéro unique
- `client_id` : Client
- `statut` : État de la commande
- `total_ht`, `total_ttc` : Montants

### 6. **Mouvement**
- Traçabilité des entrées/sorties
- Types : entrée, sortie, transfert
- Lien avec commandes et navires

## Système de Sécurité

### Authentification
- **JWT** avec expiration configurable (24h par défaut)
- **Bcrypt** pour le hashage des mots de passe
- **Middleware** d'authentification sur toutes les routes protégées

### Rôles et Permissions

#### 1. **Manager**
- Accès complet à l'application
- Vision sur tous les magasins
- Gestion des utilisateurs
- Rapports globaux
- Configuration système

#### 2. **Operator** (Chef de magasin)
- Accès limité à **son magasin uniquement**
- Fonctionnalités :
  - Gestion du stock de son magasin
  - Saisie des ventes
  - Gestion des clients locaux
  - Commandes et livraisons
  - Rapports du magasin

### Middleware de Sécurité
```javascript
// Vérification d'accès au magasin
checkMagasinAccess() // Empêche l'accès inter-magasins
authenticate()       // Vérifie le token JWT
authorize(roles)     // Vérifie les rôles
```

## Flux de Données

### 1. Authentification
```
Login → JWT Token → LocalStorage → Headers API → Validation serveur
```

### 2. Gestion des Stocks
```
Saisie → Validation → Mouvement → Mise à jour Stock → Historique
```

### 3. Commandes
```
Création → Réservation Stock → Préparation → Livraison → Clôture
```

## Points Forts de l'Architecture

1. **Modularité** : Composants et services bien séparés
2. **Sécurité** : Multi-niveaux avec JWT, rôles et permissions
3. **Scalabilité** : Architecture permettant l'ajout de magasins
4. **Traçabilité** : Historique complet des mouvements
5. **Performance** : 
   - React Query pour le cache
   - Lazy loading des composants
   - Optimisation des requêtes DB

## API Endpoints Principaux

### Authentification
- `POST /api/auth/login` : Connexion
- `GET /api/auth/me` : Profil utilisateur

### Stock
- `GET /api/stock` : Liste des stocks
- `POST /api/stock/entree` : Entrée de stock
- `POST /api/stock/sortie` : Sortie de stock

### Commandes
- `GET /api/commandes` : Liste des commandes
- `POST /api/commandes` : Nouvelle commande
- `PUT /api/commandes/:id/statut` : Mise à jour statut

### Rapports
- `GET /api/rapports/stock` : État des stocks
- `GET /api/rapports/ventes` : Rapport de ventes
- `GET /api/rapports/mouvements` : Historique

## Configuration Environnement

### Variables Backend (.env)
```env
DB_NAME=its_maritime_stock
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
JWT_SECRET=[secret_key]
JWT_EXPIRES_IN=24h
```

### Variables Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK_API=false
```

## Dépendances Principales

### Backend
- express: 4.18.2
- mysql2: 3.6.5
- sequelize: 6.35.2
- jsonwebtoken: 9.0.2
- bcryptjs: 2.4.3

### Frontend
- react: 18.3.1
- react-router-dom: 6.30.1
- @tanstack/react-query: 5.80.7
- tailwindcss: 3.4.17
- axios: 1.10.0

## Recommandations d'Amélioration

1. **Tests**
   - Ajouter des tests unitaires (Jest)
   - Tests d'intégration API
   - Tests E2E (Cypress)

2. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Guide développeur
   - Documentation utilisateur

3. **Monitoring**
   - Logs structurés (Winston)
   - Métriques de performance
   - Alertes système

4. **Sécurité**
   - Refresh tokens
   - 2FA pour les managers
   - Audit trail complet

5. **Performance**
   - Mise en cache Redis
   - Pagination côté serveur
   - Optimisation des requêtes N+1

## Conclusion

L'application présente une architecture solide et bien structurée, adaptée aux besoins de gestion multi-magasins. Le système de rôles et permissions assure une séparation claire des responsabilités entre managers et chefs de magasin.