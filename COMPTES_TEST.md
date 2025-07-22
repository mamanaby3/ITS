# Comptes de Test - ITS Sénégal

## 🔐 Identifiants de Connexion

### 👨‍💼 **Administrateur Système**
- **Email** : `admin@its-senegal.com`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur système
- **Fonction** : Gestion des utilisateurs (CRUD des magasiniers)
- **Accès** : Configuration système, gestion utilisateurs
- **Interface** : Dashboard + module administration

### 🔍 **Responsable Contrôle Interne**
- **Email** : `manager.dakar@its-senegal.com`
- **Mot de passe** : `manager123`
- **Rôle** : Responsable contrôle interne
- **Fonction** : Supervision et validation des opérations
- **Accès** : Tous les 7 magasins (vue globale)
- **Interface** : Dashboard de supervision + rapports

### 📦 **Magasinier Port de Dakar**
- **Email** : `operator.port@its-senegal.com`
- **Mot de passe** : `operator123`
- **Rôle** : Magasinier (opérateur terrain)
- **Fonction** : Gestion quotidienne du stock
- **Accès** : Magasin Port de Dakar uniquement
- **Interface** : **Interface simplifiée** pour saisie entrées/sorties

### 📦 **Magasinier Thiès**
- **Email** : `operator.thies@its-senegal.com`
- **Mot de passe** : `operator123`
- **Rôle** : Magasinier (opérateur terrain)
- **Fonction** : Gestion quotidienne du stock
- **Accès** : Magasin Thiès uniquement
- **Interface** : Interface simplifiée pour son magasin

### 🚛 **Gestionnaire de Livraisons**
- **Email** : `delivery@its-senegal.com`
- **Mot de passe** : `delivery123`
- **Accès** : Toutes les livraisons inter-magasins
- **Permissions** : Gestion camions, planification livraisons, livraisons partielles
- **Interface** : **Module gestion livraisons** avec suivi camions et livraisons partielles

### 🧪 **Compte Test Rapide**
- **Email** : `test@test.com`
- **Mot de passe** : `test123`
- **Rôle** : Administrateur système
- **Fonction** : Tests et démonstrations
- **Accès** : Toutes les fonctionnalités

---

## 🏬 **Les 7 Magasins Configurés**

1. **dkr-port** - Entrepôt Principal Port (Dakar, Port)
2. **dkr-ind** - Entrepôt Zone Industrielle (Dakar, Zone Industrielle)
3. **thies** - Entrepôt Thiès (Thiès, Centre)
4. **stl** - Entrepôt Saint-Louis (Saint-Louis, Nord)
5. **kaol** - Entrepôt Kaolack (Kaolack, Centre)
6. **zigui** - Entrepôt Ziguinchor (Ziguinchor, Sud)
7. **tamb** - Entrepôt Tambacounda (Tambacounda, Est)

---

## 📱 **Pages Accessibles par Rôle**

### **👨‍💼 Administrateur**
- 🏠 **Dashboard** - Vue d'ensemble globale
- 👥 **Gestion Utilisateurs** - CRUD utilisateurs et rôles
- 🏢 **Gestion Magasins** - Configuration des magasins
- 📦 **Stock** - Tous les stocks avec sélecteur magasin
- 🛍️ **Produits** - Catalogue global
- 👥 **Clients** - Base clients complète
- 📋 **Commandes** - Toutes les commandes
- 🚚 **Livraisons** - Suivi livraisons
- 🚛 **Gestion Livraisons** - Module avancé livraisons
- 📊 **Mouvements** - Historique global
- 📈 **Rapports** - Tous les rapports

### **🏢 Manager Magasin**
- 🏠 **Dashboard** - Vue magasins assignés avec sélecteur
- 📦 **Stock** - Stock de ses magasins
- 🛍️ **Produits** - Catalogue (lecture/modification)
- 👥 **Clients** - Gestion clients
- 📋 **Commandes** - Gestion commandes
- 🚚 **Livraisons** - Suivi livraisons
- 📊 **Mouvements** - Mouvements de ses magasins
- 📈 **Rapports** - Rapports opérationnels

### **📦 Magasinier (Opérateur)**
- 🏠 **Interface Magasinier** - Dashboard spécialisé avec :
  - Son stock en temps réel
  - Commandes à préparer
  - Statut préparation
  - Alertes stock
- 📦 **Stock** - Stock de son magasin uniquement
- 🛍️ **Produits** - Consultation catalogue
- 📊 **Mouvements** - Mouvements de son magasin

### **🚛 Gestionnaire Livraisons**
- 🏠 **Dashboard** - Vue d'ensemble livraisons
- 🚛 **Gestion Livraisons** - Module complet avec :
  - Planification livraisons
  - Gestion flotte camions
  - Suivi temps réel
  - **Livraisons partielles** (ex: 200T au lieu de 250T)
  - Gestion incidents
- 📋 **Commandes** - Commandes prêtes à livrer

---

## 🔧 **Fonctionnalités Multi-Magasins**

### **Sélecteur de Magasin**
- Apparaît dans la barre de navigation pour les utilisateurs multi-magasins
- Permet de basculer entre les magasins autorisés
- Filtre automatiquement les données selon le magasin sélectionné

### **Filtrage Automatique**
- Stock filtré par magasin selon les permissions
- Mouvements filtrés par magasin
- Commandes et livraisons liées au magasin actuel

### **Données de Test par Magasin**
- **Port de Dakar** : Maïs jaune (250T), Soja (150T)
- **Zone Industrielle** : Blé tendre (500T)
- **Thiès** : Son de blé (80T)
- **Saint-Louis** : Maïs jaune (180T)
- **Kaolack** : Soja (120T)

---

## 🚀 **Comment Tester le Workflow Complet**

### **Étape 1 : Commande Client**
1. **Manager** crée une commande pour un client
2. **Commande** envoyée au magasinier du magasin concerné

### **Étape 2 : Préparation Magasinier**
1. **Magasinier** se connecte → voit interface spécialisée
2. Consulte **son stock** et **commandes à préparer**
3. **Marque produits prêts** un par un
4. Commande passe en statut "Prête"

### **Étape 3 : Organisation Livraison**
1. **Gestionnaire Livraisons** planifie la livraison
2. Assigne un **camion** selon la capacité
3. **Démarre le chargement** → camion "en route"

### **Étape 4 : Livraison Partielle (Cas Réel)**
1. **Camion arrive** chez le client
2. **Problème** : route impraticable, ne peut livrer que 200T au lieu de 250T
3. **Gestionnaire** marque **"Livraison partielle"**
4. **Système** programme automatiquement nouvelle livraison pour les 50T restantes

---

## 🧪 **Tests Spécifiques Recommandés**

### **Test Interface Magasinier**
- Connexion `operator.port@its-senegal.com`
- Voir **interface dédiée** avec stock + commandes
- Marquer produits prêts dans commandes

### **Test Gestion Livraisons**
- Connexion `delivery@its-senegal.com`
- Voir **module livraisons** avec camions
- Tester **livraison partielle** avec raison

### **Test Multi-Magasins Admin**
- Connexion `admin@its-senegal.com`
- **Sélecteur magasin** → changer entre les 7 magasins
- **CRUD utilisateurs** → créer magasinier pour un autre magasin

### **Test Permissions**
- Vérifier que magasinier voit **seulement son magasin**
- Manager voit **ses magasins assignés**
- Admin voit **tout**