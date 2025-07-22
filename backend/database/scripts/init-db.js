require('dotenv').config();
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔄 Initialisation de la base de données ITS Sénégal...');
    
    // Connexion à la base
    console.log('📡 Connexion à MySQL...');
    await sequelize.authenticate();
    console.log('✅ Connexion établie avec succès');

    // Synchroniser les modèles (créer les tables)
    console.log('🔄 Création des tables...');
    await sequelize.sync({ alter: true }); // alter: true met à jour la structure sans perdre les données
    console.log('✅ Tables créées/mises à jour avec succès');

    // Créer l'utilisateur admin par défaut
    console.log('🔄 Création de l\'utilisateur administrateur...');
    const { User } = require('../models');
    
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@its-senegal.com' },
      defaults: {
        nom: 'Administrateur',
        prenom: 'ITS',
        email: 'admin@its-senegal.com',
        password_hash: adminPassword,
        role: 'manager',
        actif: true,
        magasin_id: null // Accès à tous les magasins
      }
    });

    if (created) {
      console.log('✅ Utilisateur admin créé');
    } else {
      console.log('ℹ️  Utilisateur admin existe déjà');
    }

    // Créer les magasins par défaut
    console.log('🔄 Création des magasins...');
    const { Magasin } = require('../models');
    
    const magasins = [
      { id: 'dkr-port', nom: 'Entrepôt Principal Port', ville: 'Dakar', adresse: 'Port Autonome de Dakar' },
      { id: 'dkr-ind', nom: 'Entrepôt Zone Industrielle', ville: 'Dakar', adresse: 'Zone Industrielle' },
      { id: 'thies', nom: 'Entrepôt Thiès', ville: 'Thiès', adresse: 'Centre ville' },
      { id: 'stl', nom: 'Entrepôt Saint-Louis', ville: 'Saint-Louis', adresse: 'Nord' },
      { id: 'kaol', nom: 'Entrepôt Kaolack', ville: 'Kaolack', adresse: 'Centre' },
      { id: 'zigui', nom: 'Entrepôt Ziguinchor', ville: 'Ziguinchor', adresse: 'Sud' },
      { id: 'tamb', nom: 'Entrepôt Tambacounda', ville: 'Tambacounda', adresse: 'Est' }
    ];

    for (const magasin of magasins) {
      await Magasin.findOrCreate({
        where: { id: magasin.id },
        defaults: magasin
      });
    }
    console.log('✅ Magasins créés');

    // Créer les catégories de produits
    console.log('🔄 Création des catégories de produits...');
    const { Categorie } = require('../models');
    
    const categories = [
      { nom: 'Céréales', description: 'Maïs, Blé, Riz, Mil, Sorgho' },
      { nom: 'Légumineuses', description: 'Soja, Arachide, Niébé' },
      { nom: 'Oléagineux', description: 'Tournesol, Colza, Sésame' },
      { nom: 'Aliments pour Bétail', description: 'Aliments composés pour animaux' },
      { nom: 'Engrais', description: 'Engrais et intrants agricoles' },
      { nom: 'Produits Transformés', description: 'Farine, Huile' },
      { nom: 'Conteneurs', description: 'Conteneurs et matériel maritime' },
      { nom: 'Autres', description: 'Autres produits' }
    ];

    for (const categorie of categories) {
      await Categorie.findOrCreate({
        where: { nom: categorie.nom },
        defaults: categorie
      });
    }
    console.log('✅ Catégories créées');

    // Créer un opérateur de test pour Dakar Port
    console.log('🔄 Création d\'un opérateur de test...');
    const operatorPassword = await bcrypt.hash('Operator123!', 10);
    const [operator, operatorCreated] = await User.findOrCreate({
      where: { email: 'operator.port@its-senegal.com' },
      defaults: {
        nom: 'Ndiaye',
        prenom: 'Fatou',
        email: 'operator.port@its-senegal.com',
        password_hash: operatorPassword,
        role: 'operator',
        actif: true,
        magasin_id: 'dkr-port'
      }
    });

    if (operatorCreated) {
      console.log('✅ Opérateur de test créé');
    }

    console.log('\n✨ Initialisation terminée avec succès!');
    console.log('\n📋 Comptes créés:');
    console.log('   Admin: admin@its-senegal.com / Admin123!');
    console.log('   Opérateur: operator.port@its-senegal.com / Operator123!');
    console.log('\n🚀 Vous pouvez maintenant démarrer le serveur avec: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    console.error('Détails:', error.message);
    if (error.original) {
      console.error('Erreur MySQL:', error.original.message);
    }
    process.exit(1);
  }
}

initDatabase();