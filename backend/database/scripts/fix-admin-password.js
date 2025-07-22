const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdminPassword() {
  console.log('🔐 Fixing admin password...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('✅ Password hashed successfully');
    
    // Update admin@its-sn.com in users table
    console.log('\n1. Updating admin@its-sn.com in users table:');
    const [result1] = await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, 'admin@its-sn.com']
    );
    console.log(`   Updated ${result1.affectedRows} rows`);
    
    // Check if admin@its-sn.com exists in utilisateurs table
    console.log('\n2. Checking utilisateurs table:');
    const [existingUsers] = await connection.execute(
      'SELECT * FROM utilisateurs WHERE email = ?',
      ['admin@its-sn.com']
    );
    
    if (existingUsers.length === 0) {
      // Create admin user in utilisateurs table
      console.log('   Creating admin@its-sn.com in utilisateurs table...');
      await connection.execute(
        `INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin@its-sn.com', hashedPassword, 'Admin', 'ITS', 'manager', 1, 1]
      );
      console.log('   ✅ Admin user created');
    } else {
      // Update password
      console.log('   Updating password for admin@its-sn.com...');
      await connection.execute(
        'UPDATE utilisateurs SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@its-sn.com']
      );
      console.log('   ✅ Password updated');
    }
    
    // Also update other test users
    console.log('\n3. Updating other test users:');
    const testUsers = ['manager@its-sn.com', 'test@its.sn', 'manager@its.sn'];
    
    for (const email of testUsers) {
      await connection.execute(
        'UPDATE utilisateurs SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hashedPassword, email]
      );
      console.log(`   ✅ Updated ${email}`);
    }
    
    // Verify the update
    console.log('\n4. Verifying credentials:');
    const [verifyUsers] = await connection.execute(
      'SELECT email, role FROM utilisateurs WHERE actif = 1'
    );
    
    console.log('Active users in utilisateurs table:');
    verifyUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    
    await connection.end();
    console.log('\n✅ Password fix completed!');
    console.log('\n📝 You can now login with:');
    console.log('   Email: admin@its-sn.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Password fix failed:');
    console.error(error.message);
    process.exit(1);
  }
}

fixAdminPassword();