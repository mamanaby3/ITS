const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function createMaritimeOperators() {
  try {
    console.log('🔄 Création des opérateurs pour les magasins maritimes...');
    
    // Hash du mot de passe
    const password = await bcrypt.hash('password123', 10);
    
    // Les opérateurs pour chaque magasin (table utilisateurs)
    const operators = [
      ['operator.dkr.port@its-senegal.com', 'Opérateur', 'Port Dakar', 'operator', 'dkr-port'],
      ['operator.dkr.ind@its-senegal.com', 'Opérateur', 'Zone Industrielle', 'operator', 'dkr-ind'],
      ['operator.thies@its-senegal.com', 'Opérateur', 'Thiès', 'operator', 'thies'],
      ['operator.stl@its-senegal.com', 'Opérateur', 'Saint-Louis', 'operator', 'stl'],
      ['operator.kaol@its-senegal.com', 'Opérateur', 'Kaolack', 'operator', 'kaol'],
      ['operator.zigui@its-senegal.com', 'Opérateur', 'Ziguinchor', 'operator', 'zigui'],
      ['operator.tamb@its-senegal.com', 'Opérateur', 'Tambacounda', 'operator', 'tamb']
    ];
    
    // Créer dans la table utilisateurs (pas users)
    for (const [email, nom, prenom, role, magasin_id] of operators) {
      await sequelize.query(`
        INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif) 
        VALUES (?, ?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE password = VALUES(password)
      `, { replacements: [email, password, nom, prenom, role, magasin_id] });
      console.log(`✅ Opérateur créé: ${email} (Magasin: ${magasin_id})`);
    }
    
    console.log('\n✅ Tous les opérateurs ont été créés');
    console.log('\n📝 Connexions disponibles:');
    console.log('   Manager: manager@its-senegal.com / Manager123!');
    console.log('   Opérateurs: operator.*.@its-senegal.com / password123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

createMaritimeOperators();