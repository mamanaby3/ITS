const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Configuration MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

async function executeSQLFile() {
  try {
    console.log('🔄 Exécution du schéma maritime...');
    
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, '..', 'database-maritime-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Exécuter le SQL
    await connection.promise().query(sql);
    
    console.log('✅ Base de données maritime créée avec succès !');
    console.log('📊 Tables créées : magasins, utilisateurs, produits, navires, stocks, clients, etc.');
    console.log('👤 Utilisateur par défaut : manager@its-senegal.com / Manager123!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  } finally {
    connection.end();
  }
}

executeSQLFile();