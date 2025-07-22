const { sequelize } = require('./config/database');

async function createAllTables() {
  try {
    console.log('🔄 Création des tables...');

    // Créer table magasins
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS magasins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        type ENUM('principal', 'secondaire') DEFAULT 'secondaire',
        adresse TEXT,
        telephone VARCHAR(20),
        email VARCHAR(255),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ajouter un magasin par défaut
    await sequelize.query(`
      INSERT INTO magasins (nom, code, type) 
      VALUES ('Magasin Principal', 'MAG-001', 'principal')
      ON DUPLICATE KEY UPDATE nom = nom
    `);

    // Créer table produits
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS produits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        unite VARCHAR(50) NOT NULL,
        seuil_min INT DEFAULT 0,
        prix_unitaire DECIMAL(10,2),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Créer table stocks
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS stocks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produit_id INT NOT NULL,
        magasin_id INT NOT NULL,
        quantite INT NOT NULL DEFAULT 0,
        valeur_unitaire DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (produit_id) REFERENCES produits(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        UNIQUE KEY unique_produit_magasin (produit_id, magasin_id)
      )
    `);

    // Créer table clients
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        type ENUM('enterprise', 'individual') DEFAULT 'enterprise',
        email VARCHAR(255),
        telephone VARCHAR(20),
        adresse TEXT,
        magasin_id INT,
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (magasin_id) REFERENCES magasins(id)
      )
    `);

    // Créer table commandes
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS commandes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(100) UNIQUE NOT NULL,
        client_id INT NOT NULL,
        magasin_id INT NOT NULL,
        statut ENUM('brouillon', 'validee', 'en_preparation', 'livree', 'annulee') DEFAULT 'brouillon',
        date_commande DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_livraison_prevue DATE,
        montant_total DECIMAL(10,2) DEFAULT 0,
        created_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Créer table commande_details
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS commande_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        commande_id INT NOT NULL,
        produit_id INT NOT NULL,
        quantite INT NOT NULL,
        prix_unitaire DECIMAL(10,2) NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
        FOREIGN KEY (produit_id) REFERENCES produits(id)
      )
    `);

    // Créer table mouvements
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mouvements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('entree', 'sortie', 'transfert') NOT NULL,
        produit_id INT NOT NULL,
        magasin_id INT NOT NULL,
        magasin_destination_id INT,
        quantite INT NOT NULL,
        reference VARCHAR(255),
        motif TEXT,
        commande_id INT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (produit_id) REFERENCES produits(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        FOREIGN KEY (magasin_destination_id) REFERENCES magasins(id),
        FOREIGN KEY (commande_id) REFERENCES commandes(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Créer table livraisons
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS livraisons (
        id INT PRIMARY KEY AUTO_INCREMENT,
        numero VARCHAR(100) UNIQUE NOT NULL,
        commande_id INT NOT NULL,
        magasin_id INT NOT NULL,
        statut ENUM('en_preparation', 'en_cours', 'livree', 'annulee') DEFAULT 'en_preparation',
        date_livraison DATETIME,
        adresse_livraison TEXT,
        created_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (commande_id) REFERENCES commandes(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    console.log('✅ Toutes les tables ont été créées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
  } finally {
    await sequelize.close();
  }
}

createAllTables();