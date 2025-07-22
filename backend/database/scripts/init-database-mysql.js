require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔄 Initialisation de la base de données ITS Sénégal...');
    
    // Connexion sans spécifier la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    
    console.log('✅ Connexion à MySQL établie');
    
    // Lire et exécuter le script SQL
    const sqlPath = path.join(__dirname, 'create-tables-mysql.sql');
    const sqlScript = await fs.readFile(sqlPath, 'utf8');
    
    console.log('🔄 Création de la base de données et des tables...');
    await connection.query(sqlScript);
    console.log('✅ Base de données et tables créées avec succès');
    
    // Mettre à jour le mot de passe admin
    console.log('🔄 Configuration de l\'utilisateur admin...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    await connection.query(
      `UPDATE its_maritime_stock.utilisateurs 
       SET password_hash = ? 
       WHERE email = 'admin@its-senegal.com'`,
      [hashedPassword]
    );
    
    console.log('✅ Utilisateur admin configuré');
    console.log('📧 Email: admin@its-senegal.com');
    console.log('🔑 Mot de passe: Admin123!');
    
    console.log('\n✅ Base de données initialisée avec succès!');
    console.log('🚀 Vous pouvez maintenant lancer le serveur avec: npm start');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔐 Vérifiez vos identifiants MySQL dans le fichier .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Assurez-vous que MySQL est démarré dans XAMPP');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter l'initialisation
initDatabase();