require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createOperator() {
  try {
    console.log('🔄 Création de l\'utilisateur opérateur...\n');
    
    // Vérifier si l'opérateur existe déjà
    const existingOperator = await User.findOne({
      where: { email: 'operator@its-senegal.com' }
    });

    if (existingOperator) {
      console.log('⚠️  Un opérateur existe déjà avec cet email');
      console.log('🔒 Mise à jour du mot de passe...');
      
      const hashedPassword = await bcrypt.hash('operator123', 10);
      await existingOperator.update({ 
        password: hashedPassword,
        actif: true,
        role: 'operator'
      });
      
      console.log('✅ Mot de passe mis à jour');
    } else {
      // Créer l'utilisateur opérateur
      console.log('🔄 Création de l\'opérateur...');
      const hashedPassword = await bcrypt.hash('operator123', 10);
      
      const operatorUser = await User.create({
        nom: 'Opérateur',
        prenom: 'Port',
        email: 'operator@its-senegal.com',
        password: hashedPassword,
        role: 'operator',
        magasin_id: 'DKR-PORT', // Assigné au port de Dakar
        actif: true
      });

      console.log('✅ Opérateur créé avec succès!');
    }

    console.log('\n✨ Identifiants de connexion:');
    console.log('📧 Email: operator@its-senegal.com');
    console.log('🔒 Mot de passe: operator123');
    console.log('🏭 Magasin: Port de Dakar (DKR-PORT)');
    console.log('\n📝 Permissions:');
    console.log('- Saisie des réceptions (entrées)');
    console.log('- Saisie des livraisons (sorties)');
    console.log('- Consultation du stock');
    console.log('- Export des données');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  }
}

createOperator();