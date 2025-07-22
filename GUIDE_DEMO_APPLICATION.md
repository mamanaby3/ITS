# Guide de Démonstration - Application de Gestion de Stock ITS-SN

## 🎯 Objectif
Ce guide vous accompagne dans une démonstration complète de l'application de gestion de stock ITS-SN, en simulant des scénarios réels d'utilisation.

## 📋 Prérequis
- Application lancée (frontend sur http://localhost:5173 et backend sur http://localhost:5000)
- Comptes de test disponibles (voir COMPTES_TEST.md)

## 🎬 Scénarios de Démonstration

### 1. Connexion et Navigation (2 min)

#### Étapes :
1. **Accéder à l'application** : http://localhost:5173
2. **Se connecter en tant qu'Admin** :
   - Email : `admin@its-sn.com`
   - Mot de passe : `Admin123!@#`
3. **Explorer le tableau de bord** :
   - Observer les statistiques en temps réel
   - Noter les alertes de stock
   - Visualiser les graphiques de ventes

#### Points à montrer :
- Interface responsive
- Statistiques dynamiques
- Navigation intuitive

---

### 2. Gestion des Produits (3 min)

#### Étapes :
1. **Naviguer vers "Produits"** dans le menu
2. **Créer un nouveau produit** :
   - Nom : "Disque Dur SSD 1TB"
   - Catégorie : "Informatique"
   - Prix : 75000 FCFA
   - Seuil minimum : 5
   - Unité : "Pièce"
3. **Modifier le produit** :
   - Changer le prix à 70000 FCFA
4. **Rechercher le produit** dans la barre de recherche

#### Points à montrer :
- Validation des formulaires
- Recherche en temps réel
- Gestion des catégories

---

### 3. Gestion des Stocks - Entrée (4 min)

#### Étapes :
1. **Naviguer vers "Stock"**
2. **Sélectionner le magasin** "Dakar Port"
3. **Effectuer une entrée de stock** :
   - Produit : "Disque Dur SSD 1TB"
   - Quantité : 50
   - Numéro de lot : "LOT-2024-001"
   - Date d'expiration : (laisser vide)
   - Raison : "Achat fournisseur"
4. **Vérifier le mouvement** dans l'historique

#### Points à montrer :
- Sélecteur de magasin
- Traçabilité des mouvements
- Mise à jour en temps réel

---

### 4. Création d'une Commande Client (5 min)

#### Étapes :
1. **Naviguer vers "Clients"**
2. **Créer un nouveau client** :
   - Nom : "Entreprise Tech Sénégal"
   - Email : "contact@techsenegal.sn"
   - Téléphone : "+221 77 123 45 67"
   - Adresse : "Almadies, Dakar"
3. **Naviguer vers "Commandes"**
4. **Créer une nouvelle commande** :
   - Client : "Entreprise Tech Sénégal"
   - Ajouter produits :
     - Disque Dur SSD 1TB : 10 pièces
     - Câble HDMI : 20 pièces
   - Observer le calcul automatique (HT/TTC)
5. **Valider la commande**

#### Points à montrer :
- Réservation automatique du stock
- Calcul TVA 18%
- Statuts de commande

---

### 5. Livraison et Sortie de Stock (4 min)

#### Étapes :
1. **Naviguer vers "Livraisons"**
2. **Créer une livraison** pour la commande précédente :
   - Transporteur : "DHL Express"
   - Véhicule : "Camion - SN-123-AB"
   - Date prévue : Aujourd'hui
3. **Marquer comme "En cours"**
4. **Finaliser la livraison** :
   - Marquer comme "Livrée"
   - Observer la sortie de stock automatique

#### Points à montrer :
- Workflow de livraison
- Impact sur le stock
- Génération du bon de livraison

---

### 6. Rapports et Analyses (3 min)

#### Étapes :
1. **Naviguer vers "Rapports"**
2. **Générer un rapport de ventes** :
   - Période : Mois en cours
   - Magasin : Tous
3. **Explorer les données** :
   - Top produits vendus
   - Top clients
   - Évolution des ventes
4. **Exporter le rapport** :
   - Format Excel
   - Format PDF

#### Points à montrer :
- Filtres dynamiques
- Visualisations graphiques
- Options d'export

---

### 7. Changement de Rôle - Magasinier (3 min)

#### Étapes :
1. **Se déconnecter**
2. **Se connecter en tant que Magasinier** :
   - Email : `magasinier.dakar@its-sn.com`
   - Mot de passe : `Magasin123!`
3. **Observer l'interface simplifiée** :
   - Dashboard adapté
   - Accès limité au magasin assigné
4. **Effectuer une sortie directe** :
   - Type : "Vente client"
   - Produit : "Câble HDMI"
   - Quantité : 5

#### Points à montrer :
- Interface adaptée au rôle
- Restrictions d'accès
- Opérations simplifiées

---

### 8. Gestion Multi-Magasins (3 min)

#### Étapes :
1. **Se reconnecter en Admin**
2. **Naviguer vers "Stock"**
3. **Effectuer un transfert** :
   - De : Dakar Port
   - Vers : Zone Industrielle
   - Produit : "Disque Dur SSD 1TB"
   - Quantité : 10
4. **Vérifier les mouvements** dans les deux magasins

#### Points à montrer :
- Transferts inter-magasins
- Traçabilité complète
- Isolation des données

---

### 9. Alertes et Notifications (2 min)

#### Étapes :
1. **Créer une situation d'alerte** :
   - Effectuer des sorties jusqu'au seuil minimum
2. **Observer les alertes** :
   - Badge sur le menu
   - Notification toast
   - Liste des produits en alerte
3. **Traiter l'alerte** :
   - Créer une entrée de réapprovisionnement

#### Points à montrer :
- Système d'alertes proactif
- Gestion des seuils
- Actions correctives

---

### 10. Fonctionnalités Avancées (2 min)

#### Démontrer rapidement :
1. **Mode sombre** : Toggle dans le header
2. **Recherche globale** : Barre de recherche principale
3. **Filtres avancés** : Dans les listes
4. **Impression** : Bons de livraison
5. **Responsive** : Redimensionner la fenêtre

---

## 📊 Points Clés à Retenir

### Avantages de la Solution :
1. **Multi-magasins** : Gestion centralisée de 7 sites
2. **Rôles et permissions** : Sécurité granulaire
3. **Traçabilité** : Historique complet
4. **Temps réel** : Mises à jour instantanées
5. **Rapports** : Analyses détaillées
6. **Interface intuitive** : Adaptée à chaque utilisateur

### Cas d'Usage Principaux :
- Gestion d'inventaire multi-sites
- Suivi des ventes et commandes
- Optimisation des stocks
- Analyse de performance
- Collaboration entre équipes

## 🎯 Scénario Bonus : Simulation de Journée Type

### Matin (8h-12h) - Magasinier
1. Connexion et vérification du dashboard
2. Réception de marchandises (entrées)
3. Traitement des commandes urgentes
4. Ventes au comptoir

### Après-midi (14h-17h) - Manager
1. Validation des commandes importantes
2. Analyse des rapports de ventes
3. Ajustements de stock si nécessaire
4. Planification des transferts

### Fin de journée (17h-18h) - Admin
1. Supervision globale
2. Génération des rapports journaliers
3. Vérification des alertes
4. Planification du lendemain

## 💡 Conseils pour la Démo

1. **Préparer des données** : Avoir quelques produits et clients déjà créés
2. **Scénarios réalistes** : Utiliser des cas concrets de l'entreprise
3. **Montrer les erreurs** : Démontrer la gestion des cas d'erreur
4. **Questions fréquentes** : Anticiper les questions sur la sécurité et les permissions
5. **Performance** : Montrer la rapidité de l'application

## 🚀 Conclusion

Cette démonstration couvre l'ensemble des fonctionnalités principales de l'application. Pour une démo efficace :
- Durée totale : 30-35 minutes
- Adapter selon l'audience
- Préparer des données de test réalistes
- Avoir des réponses aux questions techniques

N'hésitez pas à personnaliser ce guide selon vos besoins spécifiques !