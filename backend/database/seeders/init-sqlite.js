const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Créer ou ouvrir la base de données SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Initialisation de la base de données SQLite...');

// Fonction pour exécuter des requêtes
const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Fonction pour insérer des données
const runInsert = (query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Créer les tables
const createTables = async () => {
  try {
    // Table utilisateurs
    await runQuery(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        role TEXT NOT NULL,
        magasin_id TEXT,
        actif INTEGER DEFAULT 1,
        derniere_connexion TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table magasins
    await runQuery(`
      CREATE TABLE IF NOT EXISTS magasins (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        ville TEXT NOT NULL,
        adresse TEXT,
        telephone TEXT,
        email TEXT,
        manager_id INTEGER,
        actif INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES utilisateurs(id)
      )
    `);

    // Table produits
    await runQuery(`
      CREATE TABLE IF NOT EXISTS produits (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        categorie TEXT NOT NULL,
        unite_mesure TEXT NOT NULL,
        prix_unitaire REAL,
        seuil_alerte INTEGER DEFAULT 100,
        description TEXT,
        actif INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table stocks
    await runQuery(`
      CREATE TABLE IF NOT EXISTS stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produit_id TEXT NOT NULL,
        magasin_id TEXT NOT NULL,
        quantite INTEGER DEFAULT 0,
        derniere_mise_a_jour TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produit_id) REFERENCES produits(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        UNIQUE(produit_id, magasin_id)
      )
    `);

    // Table mouvements_stock
    await runQuery(`
      CREATE TABLE IF NOT EXISTS mouvements_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        produit_id TEXT NOT NULL,
        magasin_id TEXT NOT NULL,
        quantite INTEGER NOT NULL,
        reference TEXT,
        notes TEXT,
        utilisateur_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produit_id) REFERENCES produits(id),
        FOREIGN KEY (magasin_id) REFERENCES magasins(id),
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
      )
    `);

    // Table navires
    await runQuery(`
      CREATE TABLE IF NOT EXISTS navires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        numero_imo TEXT UNIQUE,
        date_arrivee TEXT NOT NULL,
        port_origine TEXT,
        statut TEXT DEFAULT 'en_attente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table receptions_navires
    await runQuery(`
      CREATE TABLE IF NOT EXISTS receptions_navires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        navire_id INTEGER NOT NULL,
        produit_id TEXT NOT NULL,
        quantite_declaree INTEGER NOT NULL,
        quantite_recue INTEGER,
        date_reception TEXT,
        statut TEXT DEFAULT 'en_attente',
        notes TEXT,
        utilisateur_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (navire_id) REFERENCES navires(id),
        FOREIGN KEY (produit_id) REFERENCES produits(id),
        FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
      )
    `);

    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur création tables:', error);
    throw error;
  }
};

// Insérer les données initiales
const insertInitialData = async () => {
  try {
    // Créer l'utilisateur admin
    const adminPassword = bcrypt.hashSync('admin123', 10);
    await runInsert(
      `INSERT OR IGNORE INTO utilisateurs (email, password_hash, nom, prenom, role, actif)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin@its-senegal.com', adminPassword, 'Admin', 'ITS', 'admin', 1]
    );
    console.log('✅ Utilisateur admin créé');

    // Créer les magasins
    const magasins = [
      { id: 'port', nom: 'Port de Dakar', ville: 'Dakar' },
      { id: 'menimur', nom: 'Ménimur', ville: 'Dakar' },
      { id: 'tobago', nom: 'Tobago', ville: 'Dakar' }
    ];

    for (const magasin of magasins) {
      await runInsert(
        `INSERT OR IGNORE INTO magasins (id, nom, ville, actif) VALUES (?, ?, ?, ?)`,
        [magasin.id, magasin.nom, magasin.ville, 1]
      );
    }
    console.log('✅ Magasins créés');

    // Créer quelques produits de base
    const produits = [
      { id: 'BLE-001', nom: 'Blé tendre', categorie: 'cereales', unite_mesure: 'tonnes', prix_unitaire: 250000 },
      { id: 'RIZ-001', nom: 'Riz parfumé', categorie: 'cereales', unite_mesure: 'tonnes', prix_unitaire: 450000 },
      { id: 'MAIS-001', nom: 'Maïs jaune', categorie: 'cereales', unite_mesure: 'tonnes', prix_unitaire: 200000 },
      { id: 'SOJA-001', nom: 'Soja', categorie: 'legumineuses', unite_mesure: 'tonnes', prix_unitaire: 350000 }
    ];

    for (const produit of produits) {
      await runInsert(
        `INSERT OR IGNORE INTO produits (id, nom, categorie, unite_mesure, prix_unitaire, actif)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [produit.id, produit.nom, produit.categorie, produit.unite_mesure, produit.prix_unitaire, 1]
      );
    }
    console.log('✅ Produits créés');

    // Initialiser le stock
    for (const produit of produits) {
      for (const magasin of magasins) {
        const quantite = Math.floor(Math.random() * 1000) + 100;
        await runInsert(
          `INSERT OR IGNORE INTO stocks (produit_id, magasin_id, quantite) VALUES (?, ?, ?)`,
          [produit.id, magasin.id, quantite]
        );
      }
    }
    console.log('✅ Stock initialisé');
  } catch (error) {
    console.error('❌ Erreur insertion données:', error);
    throw error;
  }
};

// Exécuter l'initialisation
const init = async () => {
  try {
    await createTables();
    await insertInitialData();
    console.log('✅ Base de données SQLite initialisée avec succès!');
    console.log('📝 Utilisateur admin: admin@its-senegal.com / admin123');
    db.close();
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    db.close();
    process.exit(1);
  }
};

init();