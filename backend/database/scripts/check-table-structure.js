const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructure() {
  console.log('🔍 Checking table structures...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    // Check utilisateurs table structure
    console.log('1. Structure of utilisateurs table:');
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM utilisateurs'
    );
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if users table exists
    console.log('\n2. Checking if users table exists:');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length > 0) {
      console.log('✅ users table exists');
      
      const [userColumns] = await connection.execute(
        'SHOW COLUMNS FROM users'
      );
      
      console.log('\nColumns in users table:');
      userColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Check data in users table
      const [users] = await connection.execute('SELECT id, email, role FROM users');
      console.log(`\n✅ Found ${users.length} users in 'users' table:`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    } else {
      console.log('❌ users table does not exist');
    }
    
    await connection.end();
    console.log('\n✅ Table structure check completed!');
    
  } catch (error) {
    console.error('❌ Table structure check failed:');
    console.error(error.message);
    process.exit(1);
  }
}

checkTableStructure();