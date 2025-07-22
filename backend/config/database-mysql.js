const mysql = require('mysql2');
require('dotenv').config();

// Configuration pour MySQL/MariaDB (XAMPP)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'its_maritime_stock',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Promisify pour utiliser async/await
const promisePool = pool.promise();

// Test de la connexion
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur de connexion à MySQL:', err.message);
    console.error('Vérifiez que MySQL est démarré dans XAMPP');
    return;
  }
  console.log('✅ Connecté à MySQL avec succès');
  console.log(`📍 Base de données: ${process.env.DB_NAME || 'its_maritime_stock'}`);
  connection.release();
});

// Fonction helper pour les transactions
const beginTransaction = async () => {
  const connection = await promisePool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Export
module.exports = {
  pool: promisePool,
  beginTransaction,
  execute: (query, params) => promisePool.execute(query, params),
  query: (query, params) => promisePool.query(query, params)
};