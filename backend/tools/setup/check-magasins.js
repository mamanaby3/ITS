require('dotenv').config();
const { sequelize } = require('./config/database');

async function checkMagasins() {
  try {
    console.log('🔍 Vérification des magasins...\n');
    
    const [magasins] = await sequelize.query("SELECT id, nom FROM magasins");
    
    if (magasins.length > 0) {
      console.log('Magasins disponibles:');
      magasins.forEach(mag => {
        console.log(`- ID: ${mag.id}, Nom: ${mag.nom}`);
      });
    } else {
      console.log('⚠️ Aucun magasin trouvé dans la base de données');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkMagasins();