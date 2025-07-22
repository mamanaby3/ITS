const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔄 Initialisation de la base de données...');
    
    // Importer les modèles d'abord pour s'assurer que les associations sont définies
    const { User, Magasin, Produit, Client } = require('../models');
    
    // Force sync pour recréer les tables
    await sequelize.sync({ force: true });
    console.log('✅ Tables créées avec succès');

    // Créer les magasins
    const magasins = await Magasin.bulkCreate([
      { id: 'dkr-port', nom: 'Entrepôt Principal Port', ville: 'Dakar', zone: 'Port' },
      { id: 'dkr-ind', nom: 'Entrepôt Zone Industrielle', ville: 'Dakar', zone: 'Zone Industrielle' },
      { id: 'thies', nom: 'Entrepôt Thiès', ville: 'Thiès', zone: 'Centre' },
      { id: 'stl', nom: 'Entrepôt Saint-Louis', ville: 'Saint-Louis', zone: 'Nord' }
    ]);
    console.log(`✅ ${magasins.length} magasins créés`);

    // Créer l'utilisateur admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      email: 'admin@its-senegal.com',
      password_hash: adminPassword,
      nom: 'Admin',
      prenom: 'ITS',
      role: 'admin',
      permissions: ['all']
    });
    console.log('✅ Utilisateur admin créé');

    // Créer des utilisateurs managers pour chaque magasin
    const managerPassword = await bcrypt.hash('manager123', 10);
    const managers = await User.bulkCreate([
      {
        email: 'manager.dakar@its-senegal.com',
        password_hash: managerPassword,
        nom: 'Manager',
        prenom: 'Dakar',
        role: 'manager',
        magasin_id: 'dkr-port',
        permissions: ['stock.manage', 'commandes.manage', 'livraisons.manage', 'rapports.view']
      },
      {
        email: 'manager.thies@its-senegal.com',
        password_hash: managerPassword,
        nom: 'Manager',
        prenom: 'Thiès',
        role: 'manager',
        magasin_id: 'thies',
        permissions: ['stock.manage', 'commandes.manage', 'livraisons.manage', 'rapports.view']
      }
    ]);
    console.log(`✅ ${managers.length} managers créés`);

    // Créer quelques produits
    const produits = await Produit.bulkCreate([
      {
        reference: 'FUEL-001',
        nom: 'Gasoil',
        description: 'Gasoil pour navires',
        categorie: 'Carburant',
        unite: 'Litre',
        prix_unitaire: 650,
        seuil_alerte: 10000
      },
      {
        reference: 'FUEL-002',
        nom: 'Fuel Lourd',
        description: 'Fuel lourd marine',
        categorie: 'Carburant',
        unite: 'Litre',
        prix_unitaire: 550,
        seuil_alerte: 15000
      },
      {
        reference: 'LUB-001',
        nom: 'Huile Marine 15W40',
        description: 'Huile moteur marine',
        categorie: 'Lubrifiant',
        unite: 'Litre',
        prix_unitaire: 2500,
        seuil_alerte: 500
      },
      {
        reference: 'LUB-002',
        nom: 'Huile Hydraulique',
        description: 'Huile hydraulique marine',
        categorie: 'Lubrifiant',
        unite: 'Litre',
        prix_unitaire: 2200,
        seuil_alerte: 300
      },
      {
        reference: 'SPARE-001',
        nom: 'Filtre à huile',
        description: 'Filtre à huile moteur marine',
        categorie: 'Pièce détachée',
        unite: 'Pièce',
        prix_unitaire: 15000,
        seuil_alerte: 20
      }
    ]);
    console.log(`✅ ${produits.length} produits créés`);

    // Créer quelques clients
    const clients = await Client.bulkCreate([
      {
        code: 'CLI-001',
        nom: 'Compagnie Maritime du Sénégal',
        email: 'contact@cms.sn',
        telephone: '+221 33 123 45 67',
        adresse: 'Port de Dakar',
        ville: 'Dakar',
        type_client: 'entreprise',
        credit_limit: 50000000,
        magasin_id: 'dkr-port'
      },
      {
        code: 'CLI-002',
        nom: 'Pêcherie Industrielle SA',
        email: 'info@pisa.sn',
        telephone: '+221 33 234 56 78',
        adresse: 'Zone Industrielle',
        ville: 'Dakar',
        type_client: 'entreprise',
        credit_limit: 30000000,
        magasin_id: 'dkr-ind'
      },
      {
        code: 'CLI-003',
        nom: 'Transport Maritime Thiès',
        email: 'contact@tmt.sn',
        telephone: '+221 33 345 67 89',
        adresse: 'Avenue Léopold Sedar Senghor',
        ville: 'Thiès',
        type_client: 'entreprise',
        credit_limit: 20000000,
        magasin_id: 'thies'
      }
    ]);
    console.log(`✅ ${clients.length} clients créés`);

    console.log('\n✅ Base de données initialisée avec succès !');
    console.log('\n📋 Comptes de test créés :');
    console.log('Admin : admin@its-senegal.com / admin123');
    console.log('Manager Dakar : manager.dakar@its-senegal.com / manager123');
    console.log('Manager Thiès : manager.thies@its-senegal.com / manager123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

initDatabase();