# 🚀 Instructions de démarrage après améliorations

## ✅ Améliorations appliquées avec succès !

### 1️⃣ Installation des dépendances

```bash
# Backend
cd backend
npm install express-rate-limit

# Frontend (retourner à la racine)
cd ..
npm install xlsx jspdf jspdf-autotable
```

### 2️⃣ Appliquer les index de base de données

```bash
cd backend
node scripts/add-indexes.js
```

### 3️⃣ Démarrer l'application

#### Option A : Avec SQLite (pour tester rapidement)
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend (ou rester à la racine)
npm run dev
```

#### Option B : Avec MySQL (production)
```bash
# Terminal 1 - Backend MySQL
cd backend
npm run start:mysql

# Terminal 2 - Frontend
npm run dev
```

## 🔒 Sécurité appliquée

- ✅ JWT Secret sécurisé généré : `1UGVjL9bbqFo7GpL35ttj0R58H5zgKSw5voG3bLLwXU=`
- ✅ Validation des mots de passe forts (8+ caractères, majuscules, minuscules, chiffres, spéciaux)
- ✅ Rate limiting sur l'authentification (5 tentatives/15 min)
- ✅ Protection contre XSS et injections SQL
- ✅ Headers de sécurité avec Helmet

## 📊 Exports améliorés

- ✅ PDF avec logo ITS et design professionnel
- ✅ Excel XLSX natif avec styles
- ✅ Bons de livraison redesignés

## ⚡ Performance optimisée

- ✅ Index de base de données créés
- ✅ Requêtes optimisées

## 🔧 Configuration importante

### Variables d'environnement (.env)
- `JWT_SECRET` : Déjà configuré avec une valeur sécurisée
- `DB_PASSWORD` : Laissé vide pour XAMPP (root sans mot de passe)
- `FRONTEND_URL` : http://localhost:3000

### Ports utilisés
- Backend : 5000
- Frontend : 3000

## 📱 Accès à l'application

1. Backend API : http://localhost:5000/api/health
2. Frontend : http://localhost:3000

## 🆘 En cas de problème

### Erreur de connexion à la base de données
```bash
# Vérifier que XAMPP/MySQL est démarré
# Vérifier le nom de la base : its_maritime_stock
```

### Erreur JWT_SECRET
```bash
# Le secret a déjà été généré et configuré
# Vérifier le fichier backend/.env
```

### Erreur de dépendances
```bash
# Réinstaller toutes les dépendances
cd backend && npm install
cd .. && npm install
```

## 📝 Comptes de test

Utilisez les comptes définis dans COMPTES_TEST.md :
- Admin : admin@its.sn / Admin123!
- Gérant : gerant@its.sn / Gerant123!
- Opérateur : operateur@its.sn / Operateur123!

## 🎉 L'application est maintenant sécurisée et optimisée !

Les améliorations incluent :
- Sécurité renforcée sur tous les points critiques
- Exports professionnels avec le logo ITS
- Performance améliorée avec les index de base de données
- Validation complète des données
- Protection contre les attaques courantes