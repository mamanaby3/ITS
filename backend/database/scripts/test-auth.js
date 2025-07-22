require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testAuth() {
  let connection;
  
  try {
    console.log('🔄 Test de l\'authentification...');
    
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    console.log('✅ Connecté à MySQL');

    // Vérifier la structure de la table utilisateurs
    console.log('\n📋 Structure de la table utilisateurs:');
    const [columns] = await connection.execute('DESCRIBE utilisateurs');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Chercher l'utilisateur admin
    console.log('\n🔍 Recherche de l\'utilisateur admin...');
    const [users] = await connection.execute(
      'SELECT id, nom, prenom, email, password_hash, role, actif FROM utilisateurs WHERE email = ?',
      ['admin@its-senegal.com']
    );

    if (users.length === 0) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Nom: ${user.nom} ${user.prenom}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Actif: ${user.actif}`);
    console.log(`  Hash: ${user.password_hash.substring(0, 20)}...`);

    // Tester le mot de passe
    console.log('\n🔐 Test du mot de passe...');
    const passwordTest = await bcrypt.compare('Admin123!', user.password_hash);
    console.log(`✅ Mot de passe valide: ${passwordTest}`);

    if (!passwordTest) {
      console.log('❌ Le hash du mot de passe ne correspond pas');
      console.log('Génération d\'un nouveau hash...');
      const newHash = await bcrypt.hash('Admin123!', 10);
      console.log(`Nouveau hash: ${newHash}`);
      
      await connection.execute(
        'UPDATE utilisateurs SET password_hash = ? WHERE email = ?',
        [newHash, 'admin@its-senegal.com']
      );
      console.log('✅ Mot de passe mis à jour');
    }

    // Lister tous les utilisateurs
    console.log('\n👥 Tous les utilisateurs:');
    const [allUsers] = await connection.execute(
      'SELECT id, nom, prenom, email, role, magasin_id, actif FROM utilisateurs ORDER BY role, nom'
    );
    
    allUsers.forEach(u => {
      console.log(`  ${u.role}: ${u.nom} ${u.prenom} (${u.email}) - Magasin: ${u.magasin_id || 'Tous'} - Actif: ${u.actif}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAuth();