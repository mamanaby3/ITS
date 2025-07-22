require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

async function seedUsers() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    // Créer les utilisateurs directement via SQL
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = [
      {
        email: 'admin@its-senegal.com',
        password: hashedPassword,
        nom: 'Admin',
        prenom: 'Système',
        role: 'admin',
        magasin_id: 1
      },
      {
        email: 'manager.dakar@its-senegal.com', 
        password: await bcrypt.hash('manager123', 10),
        nom: 'Manager',
        prenom: 'Dakar',
        role: 'manager',
        magasin_id: 1
      },
      {
        email: 'operator.port@its-senegal.com',
        password: await bcrypt.hash('operator123', 10),
        nom: 'Opérateur',
        prenom: 'Port',
        role: 'operator',
        magasin_id: 1
      },
      {
        email: 'operator.plateforme@its-senegal.com',
        password: await bcrypt.hash('operator123', 10),
        nom: 'Opérateur',
        prenom: 'Plateforme',
        role: 'operator',
        magasin_id: 1
      }
    ];

    for (const user of users) {
      try {
        // Vérifier si l'utilisateur existe
        const [existing] = await sequelize.query(
          'SELECT id FROM utilisateurs WHERE email = ?',
          { replacements: [user.email], type: sequelize.QueryTypes.SELECT }
        );

        if (existing) {
          // Mettre à jour le mot de passe
          await sequelize.query(
            'UPDATE utilisateurs SET password_hash = ?, actif = 1 WHERE email = ?',
            { replacements: [user.password, user.email] }
          );
          console.log(`✅ Utilisateur mis à jour: ${user.email}`);
        } else {
          // Créer l'utilisateur
          await sequelize.query(
            `INSERT INTO utilisateurs (nom, prenom, email, password_hash, role, magasin_id, actif, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            { 
              replacements: [
                user.nom, 
                user.prenom, 
                user.email, 
                user.password, 
                user.role, 
                user.magasin_id
              ] 
            }
          );
          console.log(`✅ Utilisateur créé: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error.message);
      }
    }

    console.log('\n✨ Utilisateurs créés/mis à jour!');
    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log('- admin@its-senegal.com / admin123');
    console.log('- manager.dakar@its-senegal.com / manager123');
    console.log('- operator.port@its-senegal.com / operator123');
    console.log('- operator.plateforme@its-senegal.com / operator123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedUsers();