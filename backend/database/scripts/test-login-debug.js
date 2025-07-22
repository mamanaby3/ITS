require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test avec connexion MySQL directe (sans Sequelize)
const mysql = require('mysql2/promise');

async function testLoginDirectly() {
  let connection;
  
  try {
    console.log('🔄 Test de login avec MySQL direct...');
    
    // Connexion directe à MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    console.log('✅ Connecté à MySQL');

    // Simuler la requête de login
    const email = 'admin@its-senegal.com';
    const password = 'Admin123!';
    
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);

    // Chercher l'utilisateur
    const [users] = await connection.execute(
      'SELECT id, nom, prenom, email, password_hash, role, magasin_id, actif FROM utilisateurs WHERE email = ? AND actif = 1',
      [email]
    );

    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Nom: ${user.nom} ${user.prenom}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Magasin: ${user.magasin_id || 'Tous'}`);

    // Vérifier le mot de passe
    console.log('\n🔐 Vérification du mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log(`✅ Mot de passe valide: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return;
    }

    // Générer le token JWT
    console.log('\n🔑 Génération du token JWT...');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log(`✅ Token généré: ${token.substring(0, 50)}...`);

    // Préparer la réponse
    const response = {
      success: true,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        magasin_id: user.magasin_id
      },
      token: token
    };

    console.log('\n✨ Simulation de login réussie !');
    console.log('📋 Réponse:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Test avec Sequelize
async function testWithSequelize() {
  try {
    console.log('\n\n🔄 Test avec Sequelize...');
    
    const { sequelize } = require('../config/database');
    const { User } = require('../models');
    
    console.log('🔄 Test de connexion Sequelize...');
    await sequelize.authenticate();
    console.log('✅ Sequelize connecté');

    console.log('🔄 Test du modèle User...');
    const user = await User.findOne({ 
      where: { email: 'admin@its-senegal.com', actif: true }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec Sequelize');
      return;
    }

    console.log('✅ Utilisateur trouvé avec Sequelize:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'UNDEFINED'}`);

    // Test du mot de passe
    if (user.password_hash) {
      const isValid = await bcrypt.compare('Admin123!', user.password_hash);
      console.log(`✅ Mot de passe Sequelize valide: ${isValid}`);
    } else {
      console.log('❌ password_hash est undefined dans Sequelize');
    }

  } catch (error) {
    console.error('❌ Erreur Sequelize:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter les tests
testLoginDirectly().then(() => {
  testWithSequelize();
});