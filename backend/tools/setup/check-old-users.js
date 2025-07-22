require('dotenv').config();
const { sequelize } = require('./config/database');

async function checkOldUsers() {
  try {
    console.log('🔍 Vérification de la table utilisateurs...\n');
    
    // Vérifier tous les utilisateurs dans l'ancienne table
    const [users] = await sequelize.query("SELECT id, nom, prenom, email, role, actif FROM utilisateurs");
    
    console.log(`Total utilisateurs dans la table 'utilisateurs': ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('Utilisateurs trouvés:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Actif: ${user.actif}`);
      });
      
      // Chercher des admins
      const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
      if (admins.length > 0) {
        console.log('\n✅ Administrateurs trouvés:');
        admins.forEach(admin => {
          console.log(`- Email: ${admin.email}`);
          console.log(`  Nom: ${admin.nom} ${admin.prenom}`);
          console.log(`  Role: ${admin.role}`);
          console.log('  Mot de passe par défaut à essayer: admin123 ou password123\n');
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkOldUsers();