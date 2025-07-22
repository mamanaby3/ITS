# 🚀 Démarrage Rapide - ITS Maritime Stock avec XAMPP

## 1️⃣ Préparer la Base de Données

1. **Démarrer XAMPP**
   - Ouvrez XAMPP Control Panel
   - Démarrez **Apache** et **MySQL**

2. **Créer la base de données**
   - Allez sur http://localhost/phpmyadmin
   - Importez le fichier `database-maritime-schema.sql`

## 2️⃣ Configurer le Backend

1. **Installer les dépendances**
   ```bash
   cd backend
   npm install
   ```

2. **Créer le fichier .env**
   ```bash
   cp .env.example .env
   ```
   
   ⚠️ **Note**: Par défaut, XAMPP utilise :
   - Utilisateur : `root`
   - Mot de passe : (vide)

## 3️⃣ Démarrer l'Application

### Terminal 1 - Backend MySQL
```bash
cd backend
npm run dev:mysql
```

Vous devriez voir :
```
✅ Connecté à MySQL avec succès
📍 Base de données: its_maritime_stock
🚀 Serveur démarré sur le port 5000
```

### Terminal 2 - Frontend
```bash
cd ..
npm run dev
```

## 4️⃣ Se Connecter

1. Ouvrez http://localhost:3000
2. Connectez-vous avec :
   - **Email** : `manager@its-senegal.com`
   - **Mot de passe** : `Manager123!`

## 📋 Commandes Utiles

### Backend
```bash
# Démarrer avec MySQL
npm run start:mysql

# Mode développement avec MySQL (rechargement automatique)
npm run dev:mysql

# Générer un hash de mot de passe
npm run hash-password
```

### Base de données
```bash
# Vérifier la connexion MySQL dans phpMyAdmin
http://localhost/phpmyadmin
```

## 🔧 Dépannage Rapide

### ❌ Erreur de connexion MySQL
```
Erreur: ER_ACCESS_DENIED_ERROR
```
**Solution** : Vérifiez le mot de passe dans `.env`

### ❌ Port 5000 déjà utilisé
**Solution** : Changez le port dans `.env` :
```env
PORT=5001
```

### ❌ Erreur CORS
**Solution** : Vérifiez que `FRONTEND_URL` dans `.env` correspond à votre URL frontend

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **API Health Check** : http://localhost:5000/api/health
2. **Frontend** : http://localhost:3000
3. **phpMyAdmin** : http://localhost/phpmyadmin

## 🎯 Prochaines Étapes

1. **Créer un opérateur** : Connectez-vous en tant que manager et créez un chef de magasin
2. **Réceptionner un navire** : Testez le formulaire de réception
3. **Dispatcher** : Distribuez la cargaison vers les magasins
4. **Gérer les stocks** : Testez les entrées/sorties

---

💡 **Astuce** : Gardez XAMPP Control Panel ouvert pour surveiller l'état de MySQL et Apache.