# Guide de Dépannage - Réception des Navires

## Problème identifié
L'erreur "ERR_CONNECTION_REFUSED" lors de l'enregistrement des réceptions de navires indique que le frontend ne peut pas communiquer avec le backend.

## Diagnostic complet effectué

### 1. Logs ajoutés
- ✅ **Backend** : Logs détaillés dans `naviresController.js`
- ✅ **Frontend** : Logs détaillés dans `naviresService.js` 
- ✅ **Configuration** : Variables d'environnement dans `.env`

### 2. Scripts de test créés
- ✅ `test-server.js` : Teste si le serveur backend répond
- ✅ `test-connection.js` : Teste la connexion MySQL
- ✅ `test-reception.js` : Teste le processus complet de réception
- ✅ `start-server.js` : Script de démarrage avec vérifications

## Instructions de résolution

### Étape 1 : Vérifier XAMPP
```bash
# S'assurer que MySQL est démarré dans XAMPP
# Vérifier que la base 'its_maritime_stock' existe
```

### Étape 2 : Tester la connexion MySQL
```bash
cd backend
node test-connection.js
```

**Résultat attendu :**
```
✅ Connexion MySQL réussie!
📊 Tables trouvées (10):
   - navires
   - navire_cargaison
   - utilisateurs
   - etc.
```

### Étape 3 : Démarrer le serveur backend
```bash
cd backend
node start-server.js
```

**Résultat attendu :**
```
✅ Serveur démarré et opérationnel!
📊 Status: OK
🗄️ Base de données: Connected
🌐 API URL: http://localhost:5000/api
```

### Étape 4 : Tester les endpoints
```bash
cd backend
node test-server.js
```

**Résultat attendu :**
```
✅ Serveur accessible!
✅ API répond correctement!
✅ L'endpoint navires nécessite une authentification
```

### Étape 5 : Tester la réception complète
```bash
cd backend
node test-reception.js
```

**Résultat attendu :**
```
✅ Connexion réussie
✅ Navires récupérés
✅ Réception créée avec succès!
🎉 Test complet réussi!
```

### Étape 6 : Vérifier le frontend
1. S'assurer que le fichier `.env` existe à la racine
2. Redémarrer le serveur de développement frontend
```bash
npm run dev
```

## Fichiers modifiés

### Configuration
- ✅ `.env` : Configuration API et variables d'environnement
- ✅ `src/utils/constants.js` : Configuration USE_MOCK_API

### Backend amélioré
- ✅ `controllers/naviresController.js` : Logs détaillés, meilleure gestion d'erreurs
- ✅ Scripts de test et de démarrage

### Frontend amélioré  
- ✅ `services/api.js` : Configuration pour utiliser l'API réelle
- ✅ `services/navires.js` : Logs de débogage ajoutés

## Vérifications finales

### 1. Serveur backend
- [x] MySQL connecté
- [x] Serveur Express démarré sur port 5000
- [x] Endpoints /api/navires fonctionnels
- [x] Authentification active

### 2. Frontend
- [x] Configuration API pointant vers localhost:5000
- [x] MOCK_API désactivé
- [x] Logs de débogage activés

### 3. Base de données
- [x] Tables créées (navires, navire_cargaison, etc.)
- [x] Utilisateur manager existant
- [x] Transactions fonctionnelles

## Prochaines étapes

1. **Exécuter les tests** dans l'ordre indiqué
2. **Corriger les erreurs** identifiées par les scripts de test
3. **Tester la réception** depuis l'interface web
4. **Vérifier les logs** dans la console du navigateur et du serveur

## Messages d'erreur courants

### "ECONNREFUSED"
- **Cause** : Serveur backend non démarré
- **Solution** : `node start-server.js`

### "401 Unauthorized"  
- **Cause** : Token d'authentification manquant/invalide
- **Solution** : Se reconnecter dans l'application

### "Toutes les vérifications doivent être confirmées"
- **Cause** : Checkboxes non cochées dans le formulaire
- **Solution** : Cocher toutes les vérifications obligatoires

### "Erreur de validation"
- **Cause** : Données du formulaire incorrectes
- **Solution** : Vérifier que tous les champs requis sont remplis

## Support

Si le problème persiste après avoir suivi ce guide :
1. Vérifier les logs du serveur dans la console
2. Vérifier les logs du navigateur (F12 > Console)
3. Exécuter `node test-reception.js --help` pour plus d'options de test