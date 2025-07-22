const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function create7Magasins() {
  try {
    console.log('🔄 Création des 7 magasins et des chefs de magasin...');

    // Les 7 magasins
    const magasins = [
      { id: 'MAG-001', nom: 'Magasin Dakar Port', ville: 'Dakar', zone: 'Port' },
      { id: 'MAG-002', nom: 'Magasin Pikine', ville: 'Pikine', zone: 'Zone Industrielle' },
      { id: 'MAG-003', nom: 'Magasin Rufisque', ville: 'Rufisque', zone: 'Centre' },
      { id: 'MAG-004', nom: 'Magasin Thiès', ville: 'Thiès', zone: 'Zone Commerciale' },
      { id: 'MAG-005', nom: 'Magasin Saint-Louis', ville: 'Saint-Louis', zone: 'Port' },
      { id: 'MAG-006', nom: 'Magasin Kaolack', ville: 'Kaolack', zone: 'Centre' },
      { id: 'MAG-007', nom: 'Magasin Ziguinchor', ville: 'Ziguinchor', zone: 'Port' }
    ];

    // Créer les magasins
    for (const mag of magasins) {
      await sequelize.query(`
        INSERT INTO magasins (id, nom, ville, zone, capacite_tonnes, actif) 
        VALUES (?, ?, ?, ?, 1000, true)
        ON DUPLICATE KEY UPDATE nom = VALUES(nom)
      `, { replacements: [mag.id, mag.nom, mag.ville, mag.zone] });
      console.log(`✅ Magasin créé: ${mag.nom}`);
    }

    // Créer un chef pour chaque magasin
    const password = await bcrypt.hash('password123', 10);
    
    const chefs = [
      ['chef.dakar@its-senegal.com', 'Chef', 'Dakar', 'MAG-001'],
      ['chef.pikine@its-senegal.com', 'Chef', 'Pikine', 'MAG-002'],
      ['chef.rufisque@its-senegal.com', 'Chef', 'Rufisque', 'MAG-003'],
      ['chef.thies@its-senegal.com', 'Chef', 'Thiès', 'MAG-004'],
      ['chef.saintlouis@its-senegal.com', 'Chef', 'Saint-Louis', 'MAG-005'],
      ['chef.kaolack@its-senegal.com', 'Chef', 'Kaolack', 'MAG-006'],
      ['chef.ziguinchor@its-senegal.com', 'Chef', 'Ziguinchor', 'MAG-007']
    ];

    for (const chef of chefs) {
      await sequelize.query(`
        INSERT INTO users (email, password, nom, prenom, role, magasin_id, actif) 
        VALUES (?, ?, ?, ?, 'operateur_saisie', ?, true)
        ON DUPLICATE KEY UPDATE password = VALUES(password)
      `, { replacements: [...chef.slice(0, 3), password, chef[3]] });
      console.log(`✅ Chef créé: ${chef[0]}`);
    }

    // Mettre à jour le manager existant pour qu'il n'ait pas de magasin spécifique
    await sequelize.query(`
      UPDATE users SET magasin_id = NULL WHERE email = 'manager.dakar@its-senegal.com'
    `);

    console.log('✅ Tous les magasins et chefs ont été créés avec succès');
    console.log('\n📝 Connexions pour les chefs de magasin:');
    console.log('   Email: chef.dakar@its-senegal.com (et autres)');
    console.log('   Mot de passe: password123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
  }
}

create7Magasins();