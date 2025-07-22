require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function resetPassword() {
  try {
    console.log('🔄 Réinitialisation du mot de passe...\n');
    
    // Chercher l'utilisateur manager
    const user = await User.findOne({
      where: { email: 'manager@its-senegal.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('- Email:', user.email);
    console.log('- Nom:', user.nom, user.prenom);
    console.log('- Role:', user.role);
    
    // Réinitialiser le mot de passe
    const newPassword = 'manager123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ 
      password: hashedPassword,
      actif: true
    });
    
    console.log('\n✅ Mot de passe réinitialisé avec succès!');
    console.log('\n📋 Identifiants de connexion:');
    console.log('📧 Email: manager@its-senegal.com');
    console.log('🔒 Mot de passe: manager123');
    
    // Test du mot de passe
    console.log('\n🔐 Vérification...');
    const isValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('- Test du mot de passe:', isValid ? '✅ OK' : '❌ Erreur');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetPassword();