# 🔐 Comptes de connexion - ITS Maritime Stock

## 👔 Manager (Administrateur)

**Email :** `admin@its-senegal.com`  
**Mot de passe :** `Admin123!`

### Accès :
- ✅ Tableau de bord complet
- ✅ Réception des navires
- ✅ Dispatching vers magasins
- ✅ Vue globale des stocks
- ✅ Gestion des clients et produits
- ✅ Rapports d'écarts (dispatch vs entrées)
- ✅ Tous les mouvements de stock

### Pages disponibles :
1. `/suivi-tonnage` - Tableau de bord principal
2. `/reception-navires` - Enregistrement des navires
3. `/dispatching` - Distribution vers magasins
4. `/gestion-tonnage` - Stock global
5. `/mouvements` - Historique complet
6. `/clients` - Gestion clients
7. `/produits` - Catalogue produits
8. `/comparaison-livraisons` - Rapport d'écarts
9. `/profile` - Profil utilisateur

---

## 👷 Magasinier (Opérateur)

### Exemple : Plateforme Belair

**Email :** `operator.plateforme@its-senegal.com`  
**Mot de passe :** `operator123`

### Accès :
- ✅ Interface simplifiée
- ✅ Saisie des entrées (confirmations de réception)
- ✅ Gestion du stock de son magasin uniquement
- ✅ Saisie des sorties vers clients
- ✅ Vue de son stock actuel

### Pages disponibles :
1. `/magasinier-simple` - Tableau de bord simplifié
2. `/saisie-simple` - Enregistrer les entrées
3. `/stock-simple` - Mon stock actuel
4. `/tableau-stock` - Vue détaillée du stock
5. `/profile` - Profil utilisateur

---

## 📝 Autres comptes magasiniers

Les comptes magasiniers suivent le format :
- **Email :** `operator.[nom_magasin]@its-senegal.com`
- **Mot de passe :** `operator123`

### Exemples :
- Belair Garage : `operator.belair@its-senegal.com`
- Entrepôt Rufisque : `operator.rufisque@its-senegal.com`
- SIPS Pikine : `operator.pikine@its-senegal.com`
- Entrepôt Yarakh : `operator.yarakh@its-senegal.com`

---

## 🔄 Flux de travail

### Manager :
1. Réceptionne les navires
2. **Dispatche** les produits vers les magasins (type: DISPATCH)
3. Consulte les rapports d'écarts

### Magasinier :
1. Confirme les réceptions par des **entrées** (type: ENTREE)
2. Effectue les **sorties** vers les clients (type: SORTIE)
3. Consulte son stock actuel

### Système :
- Compare automatiquement DISPATCH vs ENTREE
- Détecte et signale les écarts
- Maintient la traçabilité complète