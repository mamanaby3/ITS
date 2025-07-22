# Guide de Configuration de la Base de Données

## Configuration Actuelle
L'application utilise actuellement des **données mockées** (stockées dans le localStorage du navigateur).

## Pour Utiliser une Base de Données Réelle

### Option 1: MySQL avec XAMPP (Recommandé)

1. **Installer et démarrer XAMPP**
   - Téléchargez XAMPP depuis https://www.apachefriends.org/
   - Démarrez Apache et MySQL

2. **Créer la base de données**
   - Ouvrez phpMyAdmin (http://localhost/phpmyadmin)
   - Créez une nouvelle base de données nommée `its_maritime_stock`

3. **Configurer le backend**
   ```bash
   cd backend
   npm install
   ```

4. **Initialiser la base de données**
   ```bash
   cd backend
   npm run init-mysql
   ```

5. **Démarrer le serveur backend**
   ```bash
   cd backend
   npm start
   ```

6. **Configurer le frontend**
   - Modifiez le fichier `.env`
   - Changez `VITE_USE_MOCK_API=true` en `VITE_USE_MOCK_API=false`
   - Redémarrez l'application React

### Option 2: SQLite (Plus simple, sans installation)

1. **Installer les dépendances**
   ```bash
   cd backend
   npm install sqlite3
   ```

2. **Utiliser le serveur SQLite**
   ```bash
   cd backend
   node server-sqlite.js
   ```

3. **Configurer le frontend** (même procédure que MySQL)

## Identifiants par défaut
- Email: `admin@its-senegal.com`
- Mot de passe: `admin123`

## Résolution des problèmes

### Erreur "Cannot connect to MySQL"
- Vérifiez que MySQL est démarré dans XAMPP
- Vérifiez les paramètres dans `backend/.env`

### Erreur "Route not found"
- Assurez-vous que le serveur backend est démarré
- Vérifiez l'URL dans le fichier `.env` du frontend

### Pour revenir aux données mockées
- Changez `VITE_USE_MOCK_API=false` en `VITE_USE_MOCK_API=true`
- Redémarrez l'application