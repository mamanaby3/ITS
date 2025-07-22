require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User, Magasin } = require('../models');

async function seedAdmin() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    // Synchroniser les tables
    console.log('🔄 Synchronisation des tables...');
    await sequelize.sync();
    console.log('✅ Tables synchronisées');

    // Créer un magasin par défaut
    console.log('🔄 Création du magasin principal...');
    const [magasin] = await Magasin.findOrCreate({
      where: { nom: 'Magasin Principal' },
      defaults: {
        nom: 'Magasin Principal',
        ville: 'Dakar',
        adresse: '123 Rue du Port',
        telephone: '+221 33 123 45 67',
        email: 'magasin.principal@its-maritime.com',
        actif: true
      }
    });
    console.log('✅ Magasin créé ou trouvé:', magasin.nom);

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: 'admin@its-maritime.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà avec cet email');
      console.log('📧 Email: admin@its-maritime.com');
      console.log('🔒 Mise à jour du mot de passe...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await existingAdmin.update({ 
        password: hashedPassword,
        actif: true 
      });
      
      console.log('✅ Mot de passe mis à jour: admin123');
    } else {
      // Créer l'utilisateur admin
      console.log('🔄 Création de l\'utilisateur admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await User.create({
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@its-maritime.com',
        password: hashedPassword,
        role: 'admin',
        magasin_id: magasin.id,
        actif: true,
        permissions: {
          users: { create: true, read: true, update: true, delete: true },
          produits: { create: true, read: true, update: true, delete: true },
          stock: { create: true, read: true, update: true, delete: true },
          clients: { create: true, read: true, update: true, delete: true },
          commandes: { create: true, read: true, update: true, delete: true },
          livraisons: { create: true, read: true, update: true, delete: true },
          rapports: { create: true, read: true, update: true, delete: true }
        }
      });

      console.log('✅ Administrateur créé avec succès!');
      console.log('📧 Email: admin@its-maritime.com');
      console.log('🔒 Mot de passe: admin123');
    }

    console.log('\n✨ Initialisation terminée!');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log('- Email: admin@its-maritime.com');
    console.log('- Mot de passe: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

seedAdmin();