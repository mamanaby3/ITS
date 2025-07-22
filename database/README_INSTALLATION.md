# Guide d'installation de la base de données ITS Maritime Stock

## Prérequis
- XAMPP avec MySQL/MariaDB installé et démarré
- phpMyAdmin accessible (généralement sur http://localhost/phpmyadmin)

## Instructions d'installation

### 1. Créer la base de données

1. Ouvrez phpMyAdmin dans votre navigateur
2. Cliquez sur "Nouvelle base de données"
3. Nom de la base : `its_maritime_stock`
4. Interclassement : `utf8mb4_unicode_ci`
5. Cliquez sur "Créer"

### 2. Exécuter les scripts SQL dans l'ordre

Allez dans l'onglet SQL de phpMyAdmin et exécutez les scripts suivants dans cet ordre :

#### Script 1 : Structure de base et tables principales
```sql
-- Copier/coller le contenu du fichier:
backend/scripts/init-its-senegal.sql
```

#### Script 2 : Mises à jour et tables additionnelles  
```sql
-- Copier/coller le contenu du fichier:
database/update_its_maritime_stock.sql
```

#### Script 3 : Corrections pour l'application
```sql
-- Copier/coller le contenu du fichier:
database/fix_app_connection.sql
```

### 3. Vérifier l'installation

Après avoir exécuté tous les scripts, vérifiez que :
- La base `its_maritime_stock` contient toutes les tables
- Les utilisateurs par défaut sont créés
- Les produits de test sont présents

### 4. Configuration de l'application

Vérifiez que le fichier `/backend/.env` contient :
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=its_maritime_stock
DB_USER=root
DB_PASSWORD=
```

### 5. Connexion à l'application

Utilisateurs par défaut :
- Email : `admin@its-senegal.com`
- Mot de passe : `admin123`

### Dépannage

Si l'application ne se connecte pas :
1. Vérifiez que MySQL est démarré dans XAMPP
2. Vérifiez les logs dans `/backend/logs/`
3. Testez la connexion avec : `npm run test:db` dans le dossier backend

### Structure de la base de données

La base contient les tables principales suivantes :
- `magasins` : Les 7 entrepôts ITS Sénégal
- `utilisateurs` : Gestion des utilisateurs
- `produits` : Catalogue des produits
- `stocks` : État des stocks par magasin
- `navires` : Navires et leurs cargaisons
- `commandes` : Gestion des commandes clients
- `livraisons` : Suivi des livraisons
- `mouvements_stock` : Traçabilité complète