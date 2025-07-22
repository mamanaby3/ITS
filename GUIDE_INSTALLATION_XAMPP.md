# Guide d'Installation avec XAMPP

## 📋 Prérequis

- XAMPP installé (avec MySQL/MariaDB et Apache)
- Node.js (version 16+)
- Un navigateur web moderne

## 🚀 Installation Étape par Étape

### 1. Configuration de la Base de Données

#### A. Démarrer XAMPP
1. Ouvrez XAMPP Control Panel
2. Démarrez **Apache** et **MySQL**
3. Cliquez sur **Admin** à côté de MySQL (ou allez sur http://localhost/phpmyadmin)

#### B. Créer la Base de Données
1. Dans phpMyAdmin, cliquez sur **"Nouvelle base de données"**
2. Nom : `its_maritime_stock`
3. Interclassement : `utf8mb4_unicode_ci`
4. Cliquez sur **Créer**

#### C. Importer le Schéma
1. Sélectionnez la base `its_maritime_stock`
2. Cliquez sur l'onglet **Importer**
3. Choisissez le fichier : `database-maritime-schema.sql`
4. Cliquez sur **Exécuter**

### 2. Configuration du Backend

#### A. Installer les dépendances
```bash
cd backend
npm install
```

#### B. Configurer la connexion MySQL
Créez un fichier `.env` dans le dossier `backend/` :

```env
# Configuration Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=its_maritime_stock
DB_USER=root
DB_PASSWORD=

# Configuration Serveur
PORT=5000
NODE_ENV=development

# JWT Secret (générez une clé aléatoire)
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire
JWT_EXPIRES_IN=24h

# Configuration CORS
FRONTEND_URL=http://localhost:3000
```

#### C. Mettre à jour la configuration de base de données
Modifiez `backend/config/database.js` :

```javascript
const mysql = require('mysql2');
require('dotenv').config();

// Créer le pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'its_maritime_stock',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Promisify pour async/await
const promisePool = pool.promise();

// Test de connexion
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err);
    return;
  }
  console.log('✅ Connecté à MySQL avec succès');
  connection.release();
});

module.exports = promisePool;
```

### 3. Créer un Utilisateur Manager Initial

#### A. Générer un mot de passe hashé
Créez un fichier temporaire `backend/scripts/hashPassword.js` :

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Manager123!'; // Changez ce mot de passe !
  const hash = await bcrypt.hash(password, 10);
  console.log('Mot de passe hashé:', hash);
}

hashPassword();
```

Exécutez :
```bash
node backend/scripts/hashPassword.js
```

#### B. Insérer l'utilisateur dans la base
Dans phpMyAdmin, exécutez :

```sql
UPDATE utilisateurs 
SET password = 'VOTRE_HASH_ICI' 
WHERE email = 'manager@its-senegal.com';

-- Ou créez un nouvel utilisateur
INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif) 
VALUES (
  'manager@its-senegal.com',
  'VOTRE_HASH_ICI',
  'DIALLO',
  'Mamadou',
  'manager',
  NULL,
  1
);
```

### 4. Démarrer l'Application

#### A. Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Vous devriez voir :
```
✅ Connecté à MySQL avec succès
🚀 Serveur démarré sur le port 5000
```

#### B. Terminal 2 - Frontend
```bash
cd ..
npm run dev
```

Vous devriez voir :
```
VITE v4.5.14  ready in XXX ms
➜  Local:   http://localhost:3000/
```

### 5. Tester l'Application

1. Ouvrez http://localhost:3000
2. Connectez-vous avec :
   - Email : `manager@its-senegal.com`
   - Mot de passe : `Manager123!` (ou celui que vous avez défini)

## 🔧 Dépannage

### Erreur de connexion MySQL
- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez le mot de passe dans `.env`
- Par défaut, XAMPP utilise `root` sans mot de passe

### Port déjà utilisé
- Backend : Changez `PORT=5000` dans `.env`
- Frontend : Dans `vite.config.js`, ajoutez :
  ```javascript
  server: {
    port: 3001 // ou autre port libre
  }
  ```

### Erreur CORS
Assurez-vous que `FRONTEND_URL` dans `.env` correspond à l'URL de votre frontend.

## 📊 Vérification de la Base de Données

Dans phpMyAdmin, vérifiez que vous avez :
- 7 magasins dans la table `magasins`
- 8 produits dans la table `produits`
- 5 clients dans la table `clients`
- 1 utilisateur manager dans la table `utilisateurs`

## 🎯 Prochaines Étapes

1. **Créer des opérateurs** : Connectez-vous en tant que manager et créez des comptes pour les chefs de magasin
2. **Tester la réception navires** : Créez une nouvelle réception de navire
3. **Dispatcher la cargaison** : Distribuez les produits vers les magasins
4. **Gérer les stocks** : Testez les entrées/sorties clients

## 📱 Accès Mobile

Pour accéder depuis un mobile sur le même réseau :
1. Trouvez votre IP locale : `ipconfig` (Windows)
2. Dans `vite.config.js`, ajoutez :
   ```javascript
   server: {
     host: true
   }
   ```
3. Accédez via : `http://VOTRE_IP:3000`

## 🔐 Sécurité

⚠️ **Pour la production** :
- Changez TOUS les mots de passe par défaut
- Utilisez un certificat SSL
- Configurez un firewall
- Limitez les accès à la base de données
- Utilisez des variables d'environnement sécurisées