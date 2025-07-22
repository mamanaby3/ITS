require('dotenv').config();
const { sequelize } = require('./config/database');
const { User } = require('./models');

async function checkAdmin() {
  try {
    console.log('🔍 Vérification des utilisateurs admin...\n');
    
    // Chercher tous les utilisateurs
    const users = await User.findAll({
      attributes: ['id', 'email', 'nom', 'prenom', 'role', 'actif']
    });
    
    console.log(`Total utilisateurs dans la table 'users': ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans la table users');
      console.log('Vérification de la table utilisateurs...');
      
      // Vérifier s'il y a des données dans l'ancienne table
      const [oldUsers] = await sequelize.query("SELECT * FROM utilisateurs WHERE email = 'admin@its-maritime.com'");
      if (oldUsers.length > 0) {
        console.log('✅ Utilisateur trouvé dans la table utilisateurs:');
        console.log('- Email:', oldUsers[0].email);
        console.log('- Role:', oldUsers[0].role);
        console.log('\n💡 Utilisez ces identifiants pour vous connecter');
      }
    } else {
      // Afficher les utilisateurs trouvés
      console.log('Utilisateurs trouvés:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Actif: ${user.actif}`);
      });
      
      // Chercher spécifiquement l'admin
      const admin = users.find(u => u.email === 'admin@its-maritime.com');
      if (admin) {
        console.log('\n✅ Utilisateur admin trouvé!');
        console.log('Email: admin@its-maritime.com');
        console.log('Mot de passe: admin123');
      } else {
        console.log('\n⚠️ Aucun utilisateur admin@its-maritime.com trouvé');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkAdmin();