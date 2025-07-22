// Script pour ajouter les index de performance à la base de données
const { sequelize } = require('../config/database');

const addIndexes = async () => {
  console.log('🔧 Ajout des index pour améliorer les performances...\n');

  try {
    // Index pour la table produits
    console.log('📊 Ajout des index sur la table produits...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produits_nom ON produits(nom);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produits_reference ON produits(reference);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produits_magasin ON produits(magasin_id);
    `);
    console.log('✅ Index produits ajoutés\n');

    // Index pour la table stocks
    console.log('📦 Ajout des index sur la table stocks...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stocks_produit_magasin ON stocks(produit_id, magasin_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stocks_quantite ON stocks(quantite);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stocks_seuil ON stocks(seuil_critique);
    `);
    console.log('✅ Index stocks ajoutés\n');

    // Index pour la table mouvements
    console.log('🔄 Ajout des index sur la table mouvements...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements(date);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements(produit_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_magasin ON mouvements(magasin_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_type ON mouvements(type_mouvement);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_utilisateur ON mouvements(utilisateur_id);
    `);
    console.log('✅ Index mouvements ajoutés\n');

    // Index pour la table commandes
    console.log('📝 Ajout des index sur la table commandes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_numero ON commandes(numero);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_date ON commandes(date_commande);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_magasin ON commandes(magasin_id);
    `);
    console.log('✅ Index commandes ajoutés\n');

    // Index pour la table commande_produits
    console.log('🛒 Ajout des index sur la table commande_produits...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commande_produits_commande ON commande_produits(commande_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commande_produits_produit ON commande_produits(produit_id);
    `);
    console.log('✅ Index commande_produits ajoutés\n');

    // Index pour la table livraisons
    console.log('🚚 Ajout des index sur la table livraisons...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_numero ON livraisons(numero);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_commande ON livraisons(commande_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_date ON livraisons(date_livraison);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_livraisons_statut ON livraisons(statut);
    `);
    console.log('✅ Index livraisons ajoutés\n');

    // Index pour la table clients
    console.log('👥 Ajout des index sur la table clients...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_magasin ON clients(magasin_id);
    `);
    console.log('✅ Index clients ajoutés\n');

    // Index pour la table utilisateurs
    console.log('👤 Ajout des index sur la table utilisateurs...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_magasin ON utilisateurs(magasin_id);
    `);
    console.log('✅ Index utilisateurs ajoutés\n');

    // Index composites pour les requêtes complexes
    console.log('🔍 Ajout des index composites...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_produits_magasin_categorie ON produits(magasin_id, categorie);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_mouvements_date_type ON mouvements(date, type_mouvement);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_commandes_client_statut ON commandes(client_id, statut);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_stocks_magasin_critique ON stocks(magasin_id, quantite, seuil_critique);
    `);
    console.log('✅ Index composites ajoutés\n');

    console.log('🎉 Tous les index ont été ajoutés avec succès!');
    console.log('📈 Les performances des requêtes devraient être significativement améliorées.\n');

    // Afficher les statistiques
    const [results] = await sequelize.query(`
      SELECT 
        table_name,
        index_name,
        column_name
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
      ORDER BY table_name, index_name;
    `);

    console.log('📊 Résumé des index créés:');
    const indexByTable = {};
    results.forEach(row => {
      if (!indexByTable[row.table_name]) {
        indexByTable[row.table_name] = [];
      }
      if (!indexByTable[row.table_name].includes(row.index_name)) {
        indexByTable[row.table_name].push(row.index_name);
      }
    });

    Object.entries(indexByTable).forEach(([table, indexes]) => {
      console.log(`\n   Table ${table}: ${indexes.length} index`);
      indexes.forEach(idx => console.log(`     - ${idx}`));
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des index:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Exécuter le script
if (require.main === module) {
  addIndexes();
}

module.exports = addIndexes;