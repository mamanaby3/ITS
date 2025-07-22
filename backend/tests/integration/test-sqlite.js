const { sequelize } = require('./config/database');
const User = require('./models/User');

async function testDatabase() {
  try {
    console.log('Test de connexion à SQLite...');
    
    await sequelize.authenticate();
    console.log('✓ Connexion à SQLite réussie');
    
    const users = await User.findAll({
      attributes: ['email', 'role', 'is_active']
    });
    
    console.log('\nUtilisateurs dans la base:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Actif: ${user.is_active}`);
    });
    
    console.log('\nTest de connexion avec admin@its.sn...');
    const admin = await User.findOne({ where: { email: 'admin@its.sn' } });
    if (admin) {
      console.log('✓ Utilisateur admin trouvé');
    } else {
      console.log('✗ Utilisateur admin non trouvé');
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

testDatabase();