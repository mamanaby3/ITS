const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test raw MySQL connection first
    console.log('1. Testing raw MySQL connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ MySQL server is accessible\n');
    
    // Check if database exists
    console.log('2. Checking if database exists...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    
    if (!dbExists) {
      console.log(`❌ Database '${process.env.DB_NAME}' does not exist!`);
      console.log('Creating database...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      console.log('✅ Database created successfully\n');
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' exists\n`);
    }
    
    await connection.end();
    
    // Test Sequelize connection
    console.log('3. Testing Sequelize connection...');
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ Sequelize connection successful\n');
    
    // Check tables
    console.log('4. Checking existing tables...');
    const [tables] = await sequelize.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database!');
      console.log('You may need to run database initialization.\n');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    }
    
    await sequelize.close();
    console.log('\n✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MySQL server is not running!');
      console.error('Please ensure XAMPP/MySQL is started.');
    }
    
    process.exit(1);
  }
}

testDatabase();