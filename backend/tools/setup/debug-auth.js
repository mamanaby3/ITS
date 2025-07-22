require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

async function debugAuth() {
  try {
    console.log('🔍 Debug du processus d\'authentification\n');
    
    const email = 'manager@its-senegal.com';
    const password = 'manager123';
    
    console.log('1️⃣ Recherche de l\'utilisateur...');
    console.log('- Email:', email);
    
    const user = await User.findOne({ 
      where: { email, actif: true }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé ou inactif');
      return;
    }
    
    console.log('✅ Utilisateur trouvé');
    console.log('- ID:', user.id);
    console.log('- Role:', user.role);
    console.log('- Actif:', user.actif);
    
    console.log('\n2️⃣ Vérification du mot de passe...');
    console.log('- Hash stocké:', user.password.substring(0, 30) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('- Résultat:', isPasswordValid ? '✅ Valide' : '❌ Invalide');
    
    if (isPasswordValid) {
      console.log('\n3️⃣ Génération du token JWT...');
      console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini');
      console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '24h');
      
      if (!process.env.JWT_SECRET) {
        console.log('\n⚠️ JWT_SECRET n\'est pas défini dans le fichier .env!');
        console.log('Ajoutez cette ligne dans votre .env:');
        console.log('JWT_SECRET=changez_cette_cle_secrete_en_production');
      } else {
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        console.log('✅ Token généré:', token.substring(0, 50) + '...');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugAuth();