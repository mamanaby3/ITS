require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createAdmin() {
  try {
    console.log('🔄 Création de l\'utilisateur admin...\n');
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: 'admin@its-senegal.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Un utilisateur existe déjà avec cet email');
      console.log('🔒 Mise à jour du mot de passe...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await existingAdmin.update({ 
        password: hashedPassword,
        actif: true,
        role: 'admin'
      });
      
      console.log('✅ Mot de passe mis à jour: admin123');
    } else {
      // Créer l'utilisateur admin
      console.log('🔄 Création de l\'utilisateur admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await User.create({
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@its-senegal.com',
        password: hashedPassword,
        role: 'admin',
        magasinId: null,  // Admin n'a pas besoin d'être assigné à un magasin spécifique
        actif: true
      });

      console.log('✅ Administrateur créé avec succès!');
    }

    console.log('\n✨ Vous pouvez maintenant vous connecter avec:');
    console.log('📧 Email: admin@its-senegal.com');
    console.log('🔒 Mot de passe: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  }
}

createAdmin();