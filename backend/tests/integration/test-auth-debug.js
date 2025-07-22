const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const { User } = require('./models');

async function testAuth() {
  try {
    // Test direct database query
    console.log('=== Test de connexion directe ===');
    
    const [users] = await sequelize.query(
      "SELECT * FROM users WHERE email = 'manager.dakar@its-senegal.com'"
    );
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
      return;
    }
    
    const user = users[0];
    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      role: user.role,
      actif: user.actif
    });
    
    // Test bcrypt
    console.log('\n=== Test bcrypt ===');
    const testPassword = 'password123';
    
    // Créer un nouveau hash pour tester
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('Nouveau hash généré:', newHash);
    
    // Tester la comparaison avec le hash en DB
    console.log('Hash en DB:', user.password);
    
    const isValid1 = await bcrypt.compare(testPassword, user.password);
    console.log('Comparaison avec hash DB:', isValid1);
    
    const isValid2 = await bcrypt.compare(testPassword, newHash);
    console.log('Comparaison avec nouveau hash:', isValid2);
    
    // Test avec Sequelize Model
    console.log('\n=== Test avec Sequelize Model ===');
    const userModel = await User.findOne({
      where: { email: 'manager.dakar@its-senegal.com' }
    });
    
    if (userModel) {
      console.log('✅ Utilisateur trouvé via Sequelize');
      const isValidModel = await bcrypt.compare(testPassword, userModel.password);
      console.log('Comparaison via Model:', isValidModel);
    } else {
      console.log('❌ Utilisateur non trouvé via Sequelize');
    }
    
    // Mettre à jour le mot de passe avec un nouveau hash
    console.log('\n=== Mise à jour du mot de passe ===');
    await sequelize.query(
      "UPDATE users SET password = ? WHERE email = ?",
      { replacements: [newHash, 'manager.dakar@its-senegal.com'] }
    );
    console.log('✅ Mot de passe mis à jour');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

testAuth();