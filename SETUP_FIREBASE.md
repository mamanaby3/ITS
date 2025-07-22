# Configuration Firebase pour ITS Sénégal

## Étapes pour configurer Firebase :

### 1. Créer un projet Firebase
1. Allez sur https://console.firebase.google.com
2. Cliquez sur "Créer un projet"
3. Nom du projet : "ITS-Senegal" (ou un autre nom)
4. Suivez les étapes de création

### 2. Activer Firestore Database
1. Dans la console Firebase, allez dans "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez "Mode production"
4. Sélectionnez la région "europe-west3" (ou la plus proche)

### 3. Configurer les règles de sécurité
Dans Firestore, allez dans "Règles" et collez ceci :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier le rôle
    function hasRole(role) {
      return isAuthenticated() && 
        request.auth.token.role == role;
    }
    
    // Règles pour les navires
    match /navires/{document} {
      allow read: if isAuthenticated();
      allow create: if hasRole('manager') || hasRole('admin');
      allow update: if hasRole('manager') || hasRole('admin');
      allow delete: if hasRole('admin');
    }
    
    // Règles pour le stock
    match /stock/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Règles pour les mouvements
    match /mouvements/{document} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if false; // Les mouvements ne peuvent pas être modifiés
      allow delete: if hasRole('admin');
    }
    
    // Règles pour les autres collections
    match /{collection}/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

### 4. Activer l'authentification
1. Dans "Authentication", cliquez sur "Commencer"
2. Activez "Adresse e-mail/Mot de passe"
3. Créez les utilisateurs pour chaque magasin

### 5. Récupérer les clés de configuration
1. Dans les paramètres du projet (roue dentée)
2. Descendez jusqu'à "Vos applications"
3. Cliquez sur "</>" pour ajouter une app Web
4. Nom : "ITS Web App"
5. Copiez la configuration

### 6. Créer le fichier .env
Créez/modifiez le fichier `.env` à la racine du projet :

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=votre-api-key
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
VITE_FIREBASE_APP_ID=votre-app-id

# Désactiver le mock API
VITE_USE_MOCK_API=false

# Activer Firebase
VITE_USE_FIREBASE=true
```

### 7. Installer les dépendances Firebase

```bash
npm install firebase
```

### 8. Créer les utilisateurs initiaux

Dans la console Firebase > Authentication, créez :

1. **Admin** : admin@its-senegal.com
2. **Manager** : manager@its-senegal.com
3. **Magasins** :
   - port.dakar@its-senegal.com
   - zi.dakar@its-senegal.com
   - thies@its-senegal.com
   - saintlouis@its-senegal.com
   - kaolack@its-senegal.com
   - ziguinchor@its-senegal.com
   - tambacounda@its-senegal.com

## Avantages de Firebase :

1. ✅ **Temps réel** : Les données se synchronisent automatiquement
2. ✅ **Sécurisé** : Authentification et règles de sécurité
3. ✅ **Scalable** : Peut gérer beaucoup d'utilisateurs
4. ✅ **Hors ligne** : Fonctionne même sans connexion
5. ✅ **Gratuit** : Plan gratuit généreux (50K lectures/jour)
6. ✅ **Simple** : Pas besoin de gérer un serveur

## Structure des données dans Firestore :

```
its-senegal/
├── users/
│   └── {userId}/
│       ├── email
│       ├── nom
│       ├── prenom
│       ├── role
│       └── magasin_id
├── navires/
│   └── {navireId}/
│       ├── nom_navire
│       ├── numero_imo
│       ├── statut
│       ├── cargaison[]
│       └── dispatching[]
├── stock/
│   └── {stockId}/
│       ├── magasin_id
│       ├── produit
│       ├── quantite
│       └── updated_at
└── mouvements/
    └── {mouvementId}/
        ├── type
        ├── magasin_id
        ├── produit
        ├── quantite
        ├── user
        └── date
```

## Support

Pour toute question sur Firebase :
- Documentation : https://firebase.google.com/docs
- Console : https://console.firebase.google.com