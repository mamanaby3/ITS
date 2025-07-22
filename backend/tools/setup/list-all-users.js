require('dotenv').config();
const { User } = require('./models');

async function listAllUsers() {
  try {
    console.log('📋 Liste de tous les utilisateurs:\n');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'nom', 'prenom', 'role', 'actif']
    });
    
    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé');
      return;
    }
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nom: ${user.nom} ${user.prenom}`);
      console.log(`Role: ${user.role}`);
      console.log(`Actif: ${user.actif ? 'Oui' : 'Non'}`);
      console.log('---');
    });
    
    console.log(`\nTotal: ${users.length} utilisateurs`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

listAllUsers();