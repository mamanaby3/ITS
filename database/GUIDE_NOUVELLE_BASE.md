# Guide de la Nouvelle Base de Données ITS Sénégal

## 🚀 Installation Rapide

### 1. Créer la base de données
```bash
mysql -u root -p < database/reset_database_complete.sql
```

### 2. Générer les mots de passe
```bash
cd backend
node utils/generatePasswords.js
```

### 3. Mettre à jour la configuration
Créer le fichier `backend/.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=its_senegal_stock
DB_PORT=3306

JWT_SECRET=your-secret-key-here
PORT=5000
```

## 📋 Structure Simplifiée

### Tables Principales
1. **magasins** - 7 magasins fixes
2. **utilisateurs** - Manager + 7 chefs de magasin
3. **produits** - Catalogue des produits
4. **clients** - Liste des clients
5. **navires** - Navires arrivés
6. **navire_cargaisons** - Contenu des navires
7. **navire_dispatching** - Distribution vers magasins/clients
8. **stock_magasin** - Stock actuel (calculé automatiquement)
9. **livraisons** - Sorties des magasins vers clients
10. **mouvements_stock** - Historique complet

## 👥 Utilisateurs de Test

### Manager Principal
- **Email**: manager@its.sn
- **Mot de passe**: 123456
- **Rôle**: Gère tout le système

### Chefs de Magasin
| Magasin | Email | Mot de passe | Responsable |
|---------|-------|--------------|-------------|
| Port Autonome | magasin1@its.sn | 123456 | Oumar NDIAYE |
| Bel Air | magasin2@its.sn | 123456 | Amadou FALL |
| Thies | magasin3@its.sn | 123456 | Ibrahima SECK |
| Rufisque | magasin4@its.sn | 123456 | Cheikh DIOP |
| Diamniadio | magasin5@its.sn | 123456 | Moussa BA |
| Mbour | magasin6@its.sn | 123456 | Abdoulaye SOW |
| Saint-Louis | magasin7@its.sn | 123456 | Modou SARR |

## 🔄 Workflow Simple

### Pour le Manager
1. **Réception Navire**
   - Créer le navire
   - Ajouter les cargaisons (produits + quantités)
   - Marquer comme "réceptionné"

2. **Dispatching**
   - Choisir le navire réceptionné
   - Dispatcher vers:
     - **Magasin**: Pour stockage
     - **Client direct**: Livraison immédiate

3. **Suivi**
   - Voir le stock de tous les magasins
   - Générer les rapports d'écarts

### Pour le Chef de Magasin
1. **Voir son stock** (mis à jour automatiquement)
2. **Créer des livraisons** vers les clients
3. **Suivre les mouvements** de son magasin

## 📊 Logique du Stock

### Calcul Automatique
```
Stock Magasin = Σ(Entrées depuis navires) - Σ(Sorties vers clients)
```

### Triggers Automatiques
- **Après dispatch vers magasin** → Stock augmente
- **Après livraison au client** → Stock diminue
- **Tous les mouvements** → Enregistrés dans l'historique

## 🔍 Requêtes Utiles

### Voir le stock d'un magasin
```sql
CALL sp_get_stock_magasin(1); -- 1 = ID du magasin
```

### Voir tous les stocks
```sql
SELECT * FROM v_stock_actuel;
```

### Rapport d'écarts
```sql
CALL sp_rapport_ecarts('2024-01-01', '2024-12-31', NULL);
```

## ✅ Points Clés

1. **Pas de stock initial** - Tout commence à zéro
2. **Stock automatique** - Calculé par les triggers
3. **Traçabilité complète** - Tous les mouvements enregistrés
4. **7 magasins fixes** - Structure claire et simple
5. **Workflow linéaire** - Navire → Dispatch → Stock → Livraison

## 🛠️ Maintenance

### Réinitialiser tout
```bash
mysql -u root -p < database/reset_database_complete.sql
```

### Sauvegarder
```bash
mysqldump -u root -p its_senegal_stock > backup_$(date +%Y%m%d).sql
```

### Restaurer
```bash
mysql -u root -p its_senegal_stock < backup_20240101.sql
```