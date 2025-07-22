const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function initUsers() {
  try {
    console.log('🔄 Création des utilisateurs...');
    
    // Synchroniser seulement la table users
    await User.sync();
    
    // Créer les utilisateurs avec les credentials du README
    const users = [
      {
        email: 'admin@its-sn.com',
        password: 'admin123',
        nom: 'Admin',
        prenom: 'ITS',
        role: 'admin',
        actif: true
      },
      {
        email: 'manager@its-sn.com',
        password: 'manager123',
        nom: 'Manager',
        prenom: 'ITS',
        role: 'manager',
        actif: true
      },
      {
        email: 'magasinier@its-sn.com',
        password: 'magasinier123',
        nom: 'Magasinier',
        prenom: 'ITS',
        role: 'magasinier',
        actif: true
      },
      // Ajouter aussi les anciens credentials pour compatibilité
      {
        email: 'admin@its.sn',
        password: '123456',
        nom: 'Admin',
        prenom: 'Test',
        role: 'admin',
        actif: true
      },
      {
        email: 'manager@its.sn',
        password: '123456',
        nom: 'Manager',
        prenom: 'Test',
        role: 'manager',
        actif: true
      },
      {
        email: 'test@its.sn',
        password: '123456',
        nom: 'Test',
        prenom: 'User',
        role: 'magasinier',
        actif: true
      }
    ];
    
    for (const userData of users) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existing = await User.findOne({ where: { email: userData.email } });
        
        if (!existing) {
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await User.create({
            ...userData,
            password: hashedPassword
          });
          console.log(`✅ Utilisateur créé: ${userData.email}`);
        } else {
          console.log(`⚠️  Utilisateur existe déjà: ${userData.email}`);
        }
      } catch (err) {
        console.error(`❌ Erreur pour ${userData.email}:`, err.message);
      }
    }
    
    console.log('\n✅ Initialisation terminée !');
    console.log('\n📋 Credentials disponibles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email                    | Mot de passe | Rôle');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('admin@its-sn.com        | admin123     | Admin');
    console.log('manager@its-sn.com      | manager123   | Manager');
    console.log('magasinier@its-sn.com   | magasinier123| Magasinier');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('admin@its.sn            | 123456       | Admin');
    console.log('manager@its.sn          | 123456       | Manager');
    console.log('test@its.sn             | 123456       | Magasinier');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

initUsers();