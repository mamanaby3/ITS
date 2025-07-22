const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyData() {
  console.log('🔍 Verifying data integrity...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    // Check key tables
    const tables = [
      'magasins',
      'utilisateurs',
      'users',
      'produits',
      'navires',
      'navire_cargaison',
      'navire_dispatching'
    ];
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }
    
    // Check relationships
    console.log('\n📊 Checking data relationships:');
    
    // Users with magasins
    const [userMagasins] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM utilisateurs u 
      LEFT JOIN magasins m ON u.magasin_id = m.id 
      WHERE u.magasin_id IS NOT NULL AND m.id IS NULL
    `);
    console.log(`   Orphaned users (no valid magasin): ${userMagasins[0].count}`);
    
    // Check views
    console.log('\n📊 Checking views:');
    const views = ['v_stock_global', 'v_mouvements_details'];
    
    for (const view of views) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${view}`);
        console.log(`✅ ${view}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${view}: ${error.message}`);
      }
    }
    
    await connection.end();
    console.log('\n✅ Data verification completed!');
    
  } catch (error) {
    console.error('❌ Data verification failed:');
    console.error(error.message);
    process.exit(1);
  }
}

verifyData();