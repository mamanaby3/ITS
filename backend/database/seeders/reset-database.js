const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
  try {
    console.log('🔄 Réinitialisation de la base de données...');
    
    // Désactiver temporairement les contraintes de clés étrangères
    await sequelize.query(`SET FOREIGN_KEY_CHECKS = 0`);
    
    // Supprimer et recréer les tables
    await sequelize.query(`DROP TABLE IF EXISTS livraisons`);
    await sequelize.query(`DROP TABLE IF EXISTS produits`);
    await sequelize.query(`DROP TABLE IF EXISTS clients`);
    await sequelize.query(`DROP TABLE IF EXISTS Users`);
    await sequelize.query(`DROP TABLE IF EXISTS magasins`);
    
    // Réactiver les contraintes de clés étrangères
    await sequelize.query(`SET FOREIGN_KEY_CHECKS = 1`);
    
    // Créer la table magasins
    await sequelize.query(`
      CREATE TABLE magasins (
        id VARCHAR(20) PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        ville VARCHAR(50) NOT NULL,
        zone VARCHAR(50),
        adresse TEXT,
        telephone VARCHAR(20),
        email VARCHAR(100),
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Créer la table Users
    await sequelize.query(`
      CREATE TABLE Users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        role ENUM('admin', 'manager', 'operator', 'magasinier') NOT NULL,
        magasinId VARCHAR(20),
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (magasinId) REFERENCES magasins(id)
      );
    `);
    
    // Créer la table clients
    await sequelize.query(`
      CREATE TABLE clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        telephone VARCHAR(20),
        adresse TEXT,
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Créer la table produits
    await sequelize.query(`
      CREATE TABLE produits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        unite VARCHAR(20) DEFAULT 'tonne',
        prix_unitaire DECIMAL(10,2),
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Créer la table livraisons
    await sequelize.query(`
      CREATE TABLE livraisons (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('entree', 'sortie') NOT NULL,
        date DATE NOT NULL,
        magasinId VARCHAR(20) NOT NULL,
        produitId INT NOT NULL,
        clientId INT NOT NULL,
        quantite DECIMAL(10,2) NOT NULL,
        prix_unitaire DECIMAL(10,2),
        montant_total DECIMAL(10,2),
        reference VARCHAR(100),
        notes TEXT,
        userId INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (magasinId) REFERENCES magasins(id),
        FOREIGN KEY (produitId) REFERENCES produits(id),
        FOREIGN KEY (clientId) REFERENCES clients(id),
        FOREIGN KEY (userId) REFERENCES Users(id)
      );
    `);
    
    // Insérer les 7 magasins
    const magasins = [
      ['DKR-PORT', 'Port de Dakar', 'Dakar', 'Dakar', 'Port Autonome de Dakar'],
      ['DKR-IND', 'Zone Industrielle Dakar', 'Dakar', 'Dakar', 'Zone Industrielle'],
      ['THIES', 'Thiès', 'Thiès', 'Thiès', 'Centre ville Thiès'],
      ['STL', 'Saint-Louis', 'Saint-Louis', 'Saint-Louis', 'Centre ville Saint-Louis'],
      ['KAOL', 'Kaolack', 'Kaolack', 'Kaolack', 'Centre ville Kaolack'],
      ['ZIGUI', 'Ziguinchor', 'Ziguinchor', 'Ziguinchor', 'Centre ville Ziguinchor'],
      ['TAMB', 'Tambacounda', 'Tambacounda', 'Tambacounda', 'Centre ville Tambacounda']
    ];
    
    for (const mag of magasins) {
      await sequelize.query(`
        INSERT INTO magasins (id, nom, ville, zone, adresse) 
        VALUES (?, ?, ?, ?, ?)
      `, { replacements: mag });
      console.log(`✅ Magasin créé: ${mag[1]}`);
    }
    
    // Créer le compte manager
    const managerPassword = await bcrypt.hash('manager123', 10);
    await sequelize.query(`
      INSERT INTO Users (email, password, nom, prenom, role) 
      VALUES ('manager@its-sn.com', ?, 'Manager', 'Général', 'manager')
    `, { replacements: [managerPassword] });
    console.log(`✅ Manager créé: manager@its-sn.com`);
    
    // Créer les comptes opérateurs
    const operatorPassword = await bcrypt.hash('operator123', 10);
    for (const mag of magasins) {
      const email = `operator.${mag[0].toLowerCase()}@its-sn.com`;
      await sequelize.query(`
        INSERT INTO Users (email, password, nom, prenom, role, magasinId) 
        VALUES (?, ?, ?, 'Opérateur', 'operator', ?)
      `, { replacements: [email, operatorPassword, `Chef ${mag[1]}`, mag[0]] });
      console.log(`✅ Opérateur créé: ${email}`);
    }
    
    // Insérer quelques produits de base
    const produits = [
      ['RIZ-001', 'Riz importé', 'Riz blanc importé', 'tonne', 350000],
      ['BLE-001', 'Blé dur', 'Blé dur pour la meunerie', 'tonne', 280000],
      ['MAIS-001', 'Maïs', 'Maïs en grain', 'tonne', 220000],
      ['SUCRE-001', 'Sucre blanc', 'Sucre cristallisé', 'tonne', 450000],
      ['HUILE-001', 'Huile végétale', 'Huile alimentaire raffinée', 'tonne', 750000]
    ];
    
    for (const prod of produits) {
      await sequelize.query(`
        INSERT INTO produits (code, nom, description, unite, prix_unitaire) 
        VALUES (?, ?, ?, ?, ?)
      `, { replacements: prod });
      console.log(`✅ Produit créé: ${prod[1]}`);
    }
    
    // Insérer quelques clients
    const clients = [
      ['ITS Maritime', 'contact@its-maritime.sn', '33 123 45 67', 'Dakar, Sénégal'],
      ['Société Import/Export', 'info@import-export.sn', '33 234 56 78', 'Thiès, Sénégal'],
      ['Grossiste National', 'contact@grossiste.sn', '33 345 67 89', 'Saint-Louis, Sénégal']
    ];
    
    for (const client of clients) {
      await sequelize.query(`
        INSERT INTO clients (nom, email, telephone, adresse) 
        VALUES (?, ?, ?, ?)
      `, { replacements: client });
      console.log(`✅ Client créé: ${client[0]}`);
    }
    
    console.log('\n✅ Base de données réinitialisée avec succès !');
    console.log('\n📋 Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Manager: manager@its-sn.com / manager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Opérateurs:');
    for (const mag of magasins) {
      const email = `operator.${mag[0].toLowerCase()}@its-sn.com`;
      console.log(`${mag[1].padEnd(25)} | ${email.padEnd(35)} | operator123`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

resetDatabase();