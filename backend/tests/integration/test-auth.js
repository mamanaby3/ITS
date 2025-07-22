require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function testAuth() {
  try {
    console.log('🔍 Test d\'authentification...\n');
    
    // Chercher l'utilisateur admin
    const user = await User.findOne({
      where: { email: 'admin@its-senegal.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Actif:', user.actif);
    console.log('- Password hash:', user.password.substring(0, 20) + '...');
    
    // Tester le mot de passe
    console.log('\n🔐 Test du mot de passe...');
    const isValid = await bcrypt.compare('admin123', user.password);
    console.log('- Mot de passe "admin123" valide:', isValid);
    
    // Si le mot de passe n'est pas valide, le réinitialiser
    if (!isValid) {
      console.log('\n🔄 Réinitialisation du mot de passe...');
      const newHash = await bcrypt.hash('admin123', 10);
      await user.update({ password: newHash });
      console.log('✅ Mot de passe réinitialisé');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAuth();