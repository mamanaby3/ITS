require('dotenv').config();
const { sequelize } = require('./config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table utilisateurs...\n');
    
    // Obtenir la structure de la table
    const [columns] = await sequelize.query("DESCRIBE utilisateurs");
    
    console.log('Colonnes de la table utilisateurs:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTableStructure();