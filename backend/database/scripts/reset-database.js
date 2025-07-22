require('dotenv').config();
const { sequelize } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    // Supprimer toutes les tables et les recréer
    console.log('🔄 Suppression et recréation des tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Base de données réinitialisée');

    console.log('\n✨ Réinitialisation terminée!');
    console.log('Exécutez maintenant: node scripts/seed-admin.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

resetDatabase();