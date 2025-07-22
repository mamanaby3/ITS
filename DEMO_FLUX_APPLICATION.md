# Guide de Démonstration - Application de Gestion de Stock ITS Sénégal

## 🚀 Démarrage de l'Application

1. **Lancer l'application**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`

2. **Page de connexion**
   - URL : `http://localhost:5173/login`
   - Interface moderne avec logo ITS
   - Champs : Email et Mot de passe
   - Validation en temps réel

## 👥 Comptes de Test et Parcours Utilisateur

### 1. **Administrateur**
**Connexion :**
- Email : `admin@its-senegal.com`
- Mot de passe : `admin123`

**Après connexion :**
- ✅ Redirection vers le **Dashboard principal**
- ✅ Accès complet à tous les modules
- ✅ Vue globale de tous les magasins

**Parcours type :**
1. **Dashboard** : Vue d'ensemble avec statistiques
   - Valeur totale du stock
   - Nombre de produits
   - Alertes de stock faible
   - Graphiques des mouvements

2. **Gestion des Produits** (`/produits`)
   - Créer un nouveau produit (Maïs, Soja, etc.)
   - Définir les seuils d'alerte
   - Gérer les catégories

3. **Gestion du Stock** (`/stock`)
   - Voir le stock de tous les magasins
   - Effectuer des entrées de stock
   - Gérer les transferts entre magasins

4. **Gestion Commerciale**
   - **Clients** (`/clients`) : Créer et gérer les clients
   - **Commandes** (`/commandes`) : Créer des commandes
   - **Livraisons** (`/livraisons`) : Planifier les livraisons

5. **Administration** (`/users`)
   - Créer de nouveaux utilisateurs
   - Assigner des rôles et permissions
   - Gérer les accès par magasin

### 2. **Manager (Responsable Contrôle Interne)**
**Connexion :**
- Email : `manager.dakar@its-senegal.com`
- Mot de passe : `manager123`

**Après connexion :**
- ✅ Redirection vers le **Dashboard principal**
- ✅ Vue de tous les magasins (lecture seule)
- ✅ Accès aux rapports et analyses

**Parcours type :**
1. **Dashboard** : Supervision globale
   - Vue consolidée des stocks
   - Alertes et anomalies
   - Performance par magasin

2. **Réception Navires** (`/reception-navires`)
   - Planning des arrivées de navires
   - Contrôle des marchandises
   - Validation des quantités et qualité
   - Enregistrement des lots

3. **Consultation Stock** (`/stock`)
   - Visualiser les niveaux de stock
   - Analyser les mouvements
   - Identifier les ruptures potentielles

4. **Rapports** (`/rapports`)
   - Générer des rapports de stock
   - Exporter en CSV/Excel
   - Analyser les tendances

5. **Tableau de Bord Opérationnel** (`/tableau-bord-operationnel`)
   - Indicateurs de performance
   - Suivi des opérations
   - Analyse comparative des magasins

### 3. **Opérateur (Magasinier)**
**Connexion :**
- Email : `operator.port@its-senegal.com`
- Mot de passe : `operator123`

**Après connexion :**
- ✅ Redirection vers le **Dashboard Magasinier**
- ✅ Interface simplifiée
- ✅ Accès limité à son magasin (Dakar Port)

**Parcours type :**
1. **Dashboard Magasinier** : Vue simplifiée
   - Stock du magasin Dakar Port uniquement
   - Tâches du jour
   - Alertes de stock faible

2. **Réception de Marchandises**
   - Bouton rapide "Nouvelle Entrée"
   - Scanner/Saisir le produit
   - Indiquer quantité et lot
   - Valider la réception

3. **Sortie de Stock**
   - Bouton rapide "Nouvelle Sortie"
   - Sélectionner le client
   - Choisir les produits
   - Confirmer la sortie

4. **Mouvements** (`/mouvements`)
   - Historique des entrées/sorties
   - Recherche par date
   - Export des mouvements

5. **Stock** (`/stock`)
   - Consultation du stock de son magasin
   - Vérification des emplacements
   - Mise à jour des positions

### 4. **Gestionnaire de Livraisons**
**Connexion :**
- Email : `delivery@its-senegal.com`
- Mot de passe : `delivery123`

**Après connexion :**
- ✅ Redirection vers **Gestion des Livraisons**
- ✅ Interface spécialisée livraisons

**Parcours type :**
1. **Gestion des Livraisons** (`/gestion-livraisons`)
   - Liste des livraisons programmées
   - Statuts en temps réel
   - Affectation des camions

2. **Planification**
   - Créer des tournées
   - Optimiser les itinéraires
   - Gérer les chauffeurs

3. **Suivi en Temps Réel**
   - Localisation des camions
   - Mise à jour des statuts
   - Gestion des incidents

## 🔄 Flux de Travail Typique

### Exemple : Réception et Livraison de Maïs

1. **Manager (Contrôleur)**
   - Reçoit une notification d'arrivée de navire
   - Accède à "Réception Navires"
   - Contrôle et enregistre 250 tonnes de maïs (LOT-2024-001)
   - Valide les documents de conformité
   - Le stock est automatiquement mis à jour

2. **Opérateur (Magasinier)**
   - Voit la nouvelle entrée validée sur son dashboard
   - Organise le stockage physique
   - Attribue les emplacements dans l'entrepôt

3. **Admin/Commercial**
   - Reçoit une commande client (50 tonnes)
   - Crée la commande dans le système
   - Vérifie la disponibilité du stock

4. **Gestionnaire de Livraisons**
   - Voit la nouvelle commande à livrer
   - Planifie la livraison
   - Affecte un camion et un chauffeur

5. **Opérateur**
   - Prépare la commande
   - Effectue la sortie de stock
   - Imprime le bon de livraison

6. **Client**
   - Reçoit la livraison
   - Signe électroniquement
   - Le système est mis à jour automatiquement

## 📊 Fonctionnalités Clés par Rôle

### Pour Tous les Utilisateurs
- 🔐 Connexion sécurisée
- 👤 Profil utilisateur (`/profile`)
- 🌓 Mode sombre/clair
- 📱 Interface responsive
- 🔔 Notifications en temps réel

### Spécifiques Admin
- 👥 Gestion complète des utilisateurs
- 🏭 Configuration des magasins
- 📊 Rapports avancés
- 🔧 Paramètres système

### Spécifiques Manager
- 📈 Analyses et statistiques
- 🔍 Audit trail
- 📋 Rapports de conformité
- 🎯 KPIs et objectifs

### Spécifiques Opérateur
- ⚡ Actions rapides (entrée/sortie)
- 📦 Gestion des lots
- 🚚 Préparation des commandes
- 📍 Gestion des emplacements

## 🎯 Points d'Attention pour la Démo

1. **Performance**
   - Chargement rapide des pages
   - Recherche instantanée
   - Mises à jour en temps réel

2. **Sécurité**
   - Déconnexion automatique après inactivité
   - Permissions granulaires
   - Audit trail complet

3. **Ergonomie**
   - Interface intuitive
   - Actions contextuelles
   - Raccourcis clavier

4. **Multi-magasin**
   - Sélecteur de magasin (admin/manager)
   - Isolation des données
   - Transferts inter-magasins

## 🚨 Scénarios de Test

### Test 1 : Circuit Complet
1. Admin crée un produit
2. Opérateur fait une entrée de stock
3. Commercial crée une commande
4. Livraison est planifiée et exécutée

### Test 2 : Gestion des Alertes
1. Stock descend sous le seuil
2. Alerte apparaît sur le dashboard
3. Manager vérifie et commande du réapprovisionnement

### Test 3 : Multi-utilisateurs
1. Ouvrir plusieurs sessions (différents rôles)
2. Effectuer des actions simultanées
3. Vérifier la synchronisation

## 📝 Notes Importantes

- **Données de test** : Toutes les données sont stockées localement (mockAPI)
- **Persistence** : Les données sont sauvegardées dans le localStorage
- **Reset** : Effacer le localStorage pour réinitialiser
- **Production** : Nécessite un backend réel (API REST)

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Linter
npm run lint
```

## 📱 Responsive Design

L'application s'adapte automatiquement :
- **Desktop** : Interface complète avec sidebar
- **Tablet** : Sidebar rétractable
- **Mobile** : Navigation bottom bar

## 🎨 Thèmes

- **Clair** : Défaut, optimal pour usage quotidien
- **Sombre** : Réduit la fatigue oculaire
- **Système** : Suit les préférences OS

---

**Version** : 1.0.0  
**Date** : Janvier 2025  
**Client** : ITS Sénégal