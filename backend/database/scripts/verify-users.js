const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyUsers() {
  console.log('🔍 Verifying users in database...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    // Check utilisateurs table
    console.log('1. Checking utilisateurs table:');
    const [users] = await connection.execute('SELECT id, nom, email, role FROM utilisateurs');
    
    if (users.length === 0) {
      console.log('❌ No users found in utilisateurs table!\n');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.nom}`);
      });
    }
    
    // Test password for admin user
    console.log('\n2. Testing admin password:');
    const [adminUser] = await connection.execute(
      'SELECT * FROM utilisateurs WHERE email = ?',
      ['admin@its-sn.com']
    );
    
    if (adminUser.length > 0) {
      const user = adminUser[0];
      const isValid = await bcrypt.compare('admin123', user.mot_de_passe);
      console.log(`   Password 'admin123' is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        // Try to update the password
        console.log('\n3. Updating admin password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
          'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
          [hashedPassword, 'admin@its-sn.com']
        );
        console.log('✅ Admin password updated to: admin123');
      }
    } else {
      console.log('❌ Admin user not found!');
      
      // Create admin user
      console.log('\n3. Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, permissions, magasin_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Admin ITS',
          'admin@its-sn.com',
          hashedPassword,
          'admin',
          JSON.stringify({
            global: ['all'],
            magasins: ['all']
          }),
          1
        ]
      );
      console.log('✅ Admin user created successfully');
    }
    
    await connection.end();
    console.log('\n✅ User verification completed!');
    
  } catch (error) {
    console.error('❌ User verification failed:');
    console.error(error.message);
    process.exit(1);
  }
}

verifyUsers();