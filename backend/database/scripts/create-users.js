require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createUsers() {
  let connection;
  
  try {
    // Connexion à MySQL
    console.log('🔄 Connexion à MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    console.log('✅ Connecté à MySQL');

    // Hasher les mots de passe
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const operatorHash = await bcrypt.hash('Operator123!', 10);
    
    // Créer l'admin
    console.log('🔄 Création du compte administrateur...');
    await connection.execute(
      `INSERT INTO utilisateurs (nom, prenom, email, password_hash, role, magasin_id, actif) 
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = ?`,
      ['Administrateur', 'ITS', 'admin@its-senegal.com', adminHash, 'manager', null, true, adminHash]
    );
    console.log('✅ Admin créé: admin@its-senegal.com / Admin123!');

    // Créer les opérateurs
    const operators = [
      { nom: 'Diallo', prenom: 'Mamadou', email: 'operator.plateforme@its-senegal.com', magasin: 'plateforme-belair' },
      { nom: 'Ndiaye', prenom: 'Fatou', email: 'operator.sips@its-senegal.com', magasin: 'sips-pikine' },
      { nom: 'Fall', prenom: 'Ibrahima', email: 'operator.belair@its-senegal.com', magasin: 'belair-garage' },
      { nom: 'Sow', prenom: 'Aissatou', email: 'operator.yarakh@its-senegal.com', magasin: 'yarakh' },
      { nom: 'Ba', prenom: 'Ousmane', email: 'operator.thiaroye@its-senegal.com', magasin: 'thiaroye-km14' },
      { nom: 'Sarr', prenom: 'Mariama', email: 'operator.km16@its-senegal.com', magasin: 'km16-thiaroye' },
      { nom: 'Diouf', prenom: 'Cheikh', email: 'operator.rufisque@its-senegal.com', magasin: 'rufisque' }
    ];

    console.log('🔄 Création des comptes opérateurs...');
    for (const op of operators) {
      await connection.execute(
        `INSERT INTO utilisateurs (nom, prenom, email, password_hash, role, magasin_id, actif) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = ?`,
        [op.nom, op.prenom, op.email, operatorHash, 'operator', op.magasin, true, operatorHash]
      );
      console.log(`✅ Opérateur créé: ${op.email} / Operator123!`);
    }

    console.log('\n✨ Tous les utilisateurs ont été créés avec succès!');
    console.log('\n📋 Récapitulatif des comptes:');
    console.log('================================');
    console.log('ADMIN:');
    console.log('  Email: admin@its-senegal.com');
    console.log('  Mot de passe: Admin123!');
    console.log('\nOPERATEURS:');
    console.log('  Tous les opérateurs utilisent le mot de passe: Operator123!');
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Vérifiez vos identifiants MySQL dans le fichier .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('La base de données "its_maritime_stock" n\'existe pas. Créez-la d\'abord dans phpMyAdmin.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
createUsers();