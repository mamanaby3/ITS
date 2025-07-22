import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function fixAdminComplete() {
  console.log('🔐 Complete admin fix...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    // First check magasins
    console.log('1. Checking magasins:');
    const [magasins] = await connection.execute('SELECT id, nom FROM magasins');
    
    if (magasins.length === 0) {
      console.log('   No magasins found. Creating default magasin...');
      await connection.execute(
        `INSERT INTO magasins (id, nom, ville, adresse, telephone, actif) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['1', 'Magasin Principal', 'Dakar', 'Port de Dakar', '+221 33 123 45 67', 1]
      );
      console.log('   ✅ Default magasin created');
    } else {
      console.log('   Found magasins:');
      magasins.forEach(m => console.log(`     - ${m.id}: ${m.nom}`));
    }
    
    // Get first magasin ID
    const [firstMagasin] = await connection.execute('SELECT id FROM magasins LIMIT 1');
    const magasinId = firstMagasin[0]?.id || '1';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('\n2. Password hashed successfully');
    
    // Update or create admin in utilisateurs
    console.log('\n3. Fixing admin@its-sn.com in utilisateurs:');
    
    // First try to update
    const [updateResult] = await connection.execute(
      'UPDATE utilisateurs SET password = ?, actif = 1 WHERE email = ?',
      [hashedPassword, 'admin@its-sn.com']
    );
    
    if (updateResult.affectedRows === 0) {
      // Create new
      try {
        await connection.execute(
          `INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['admin@its-sn.com', hashedPassword, 'Admin', 'ITS', 'manager', magasinId, 1]
        );
        console.log('   ✅ Admin created in utilisateurs');
      } catch (e) {
        console.log('   ⚠️  Admin might already exist');
      }
    } else {
      console.log('   ✅ Admin password updated in utilisateurs');
    }
    
    // Test the login
    console.log('\n4. Testing login:');
    const [testUser] = await connection.execute(
      'SELECT * FROM utilisateurs WHERE email = ? AND actif = 1',
      ['admin@its-sn.com']
    );
    
    if (testUser.length > 0) {
      const isValid = await bcrypt.compare('admin123', testUser[0].password);
      console.log(`   Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    
    // List all active users
    console.log('\n5. All active users:');
    const [allUsers] = await connection.execute(
      'SELECT email, role, magasin_id FROM utilisateurs WHERE actif = 1'
    );
    
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Magasin: ${user.magasin_id}`);
    });
    
    await connection.end();
    console.log('\n✅ Admin fix completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@its-sn.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Admin fix failed:');
    console.error(error.message);
    process.exit(1);
  }
}

fixAdminComplete();