# GUIDE DE DÉPLOIEMENT MULTI-UTILISATEUR
## Application de Gestion de Stock ITS Sénégal

### CRÉATION DES COMPTES UTILISATEURS

#### 1. MANAGER (1 compte)
```sql
-- Rôle: manager
-- Permissions: Création dispatches, vue globale tous magasins
-- Email: manager@its-sn.com
-- Mot de passe: À définir lors de la création
```

#### 2. MAGASINIERS (7 comptes - 1 par magasin)
```sql
-- Rôle: operator
-- Permissions: Réception marchandises dans leur magasin uniquement
-- Comptes suggérés:
   • magasin1@its-sn.com (Magasin 1)
   • magasin2@its-sn.com (Magasin 2)
   • magasin3@its-sn.com (Magasin 3)
   • magasin4@its-sn.com (Magasin 4)
   • magasin5@its-sn.com (Magasin 5)
   • magasin6@its-sn.com (Magasin 6)
   • magasin7@its-sn.com (Magasin 7)
```

### ÉTAPES DE CRÉATION DES UTILISATEURS

1. **Connectez-vous en tant qu'admin**
   - Email: admin
   - Mot de passe: admin123

2. **Accédez au module Administration**
   - Menu principal → Administration → Gestion des utilisateurs

3. **Pour chaque magasinier:**
   - Cliquez sur "Nouvel utilisateur"
   - Remplissez:
     * Email: magasinX@its-sn.com
     * Nom/Prénom: Nom du magasinier
     * Rôle: **operator**
     * Magasin assigné: **Magasin X**
     * Mot de passe temporaire

4. **Pour le manager:**
   - Email: manager@its-sn.com
   - Rôle: **manager**
   - Magasin: Laisser vide (accès global)

### DÉPLOIEMENT RÉSEAU LOCAL (RECOMMANDÉ)

#### Sur le PC Serveur:

1. **Installation des prérequis**
```bash
# Installer Python 3.8+
# Installer MySQL/MariaDB via XAMPP
```

2. **Configuration réseau**
```bash
# Modifier backend/.env
HOST=0.0.0.0
PORT=5000
DATABASE_URL=mysql://root:@localhost/gestion_stock_its
```

3. **Lancement du serveur**
```bash
cd backend
npm install
npm start
```

4. **Lancement frontend**
```bash
cd frontend
npm install
npm run build
npm run preview --host
```

#### Sur les PC des magasiniers:

1. Ouvrir le navigateur web
2. Accéder à: `http://[IP_SERVEUR]:5000`
3. Se connecter avec leurs identifiants

### DÉPLOIEMENT CLOUD (OPTION 2)

#### Option A: Render.com (Gratuit)

1. **Backend (API)**
   - Créer compte sur render.com
   - New → Web Service
   - Connecter repo GitHub
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Base de données**
   - New → PostgreSQL
   - Copier l'URL de connexion

3. **Frontend**
   - New → Static Site
   - Build Command: `npm run build`
   - Publish Directory: `dist`

4. **Configuration**
   - Variables d'environnement dans Render
   - VITE_API_URL = URL du backend

#### Option B: VPS Linux (5-10$/mois)

1. **Installation serveur Ubuntu**
```bash
# Mise à jour système
sudo apt update && sudo apt upgrade

# Installation Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installation MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Installation PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installation Nginx
sudo apt install nginx
```

2. **Configuration Nginx**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Démarrage avec PM2**
```bash
cd /var/www/backend
pm2 start npm --name "its-backend" -- start
pm2 save
pm2 startup
```

### SÉCURITÉ ET BONNES PRATIQUES

1. **Mots de passe**
   - Minimum 8 caractères
   - Mélange lettres, chiffres, symboles
   - Changer après première connexion

2. **Sauvegardes**
   - Sauvegarde automatique quotidienne
   - Script: `backup_database.sh`
   ```bash
   #!/bin/bash
   mysqldump -u root gestion_stock_its > backup_$(date +%Y%m%d).sql
   ```

3. **Accès réseau**
   - Firewall activé
   - Ports ouverts: 80, 443 (web), 3306 (MySQL local uniquement)

4. **Monitoring**
   - Logs d'accès
   - Alertes en cas d'erreur
   - Suivi utilisation ressources

### FORMATION DES UTILISATEURS

#### Pour les Magasiniers:
1. Connexion au système
2. Réception des rotations
3. Enregistrement des quantités
4. Signalement des écarts
5. Consultation du stock de leur magasin

#### Pour le Manager:
1. Création des dispatches
2. Attribution des rotations
3. Suivi temps réel
4. Consultation rapports
5. Vue globale tous magasins

### SUPPORT ET MAINTENANCE

- **Problème connexion**: Vérifier réseau, identifiants
- **Erreur application**: Consulter logs, redémarrer services
- **Performance lente**: Vérifier charge serveur, optimiser requêtes
- **Perte données**: Restaurer depuis sauvegarde

### CONTACTS URGENCE

- Admin système: [Votre contact]
- Support technique: [Email/Téléphone]
- Documentation: `/docs` dans l'application