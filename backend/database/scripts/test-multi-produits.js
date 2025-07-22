const { pool } = require('../config/database-mysql');

async function testMultiProduits() {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== TEST ROTATIONS MULTI-PRODUITS ===\n');
    
    // 1. Créer des dispatches pour différents produits
    console.log('1. CRÉATION DE DISPATCHES POUR DIFFÉRENTS PRODUITS:');
    
    // Récupérer quelques produits
    const [produits] = await connection.query(`
      SELECT id, nom FROM produits LIMIT 3
    `);
    
    console.log('Produits disponibles:');
    produits.forEach(p => console.log(`  - ${p.nom} (ID: ${p.id})`));
    
    // 2. Vérifier les rotations par produit
    console.log('\n2. ROTATIONS GROUPÉES PAR PRODUIT:');
    
    const [rotationsParProduit] = await connection.query(`
      SELECT 
        p.nom as produit,
        COUNT(r.id) as nombre_rotations,
        SUM(r.quantite_prevue) as total_prevu,
        SUM(r.quantite_livree) as total_livre,
        GROUP_CONCAT(r.numero_rotation SEPARATOR ', ') as numeros_rotations
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      JOIN produits p ON d.produit_id = p.id
      WHERE d.magasin_destination_id = 'plateforme-belair'
      GROUP BY p.id, p.nom
    `);
    
    rotationsParProduit.forEach(row => {
      console.log(`\n${row.produit}:`);
      console.log(`  - Nombre de rotations: ${row.nombre_rotations}`);
      console.log(`  - Total prévu: ${row.total_prevu}t`);
      console.log(`  - Total livré: ${row.total_livre || 0}t`);
      console.log(`  - Rotations: ${row.numeros_rotations}`);
    });
    
    // 3. Exemple de création multi-produits
    console.log('\n3. POUR GÉRER PLUSIEURS PRODUITS, IL FAUT:');
    console.log('  - Créer un dispatch par produit');
    console.log('  - Créer des rotations pour chaque dispatch');
    console.log('  - Exemple:');
    console.log('    * Dispatch 1: 100t de Soja → Rotation 1 (40t), Rotation 2 (60t)');
    console.log('    * Dispatch 2: 80t de Riz → Rotation 3 (50t), Rotation 4 (30t)');
    console.log('    * Total magasin = 120t (90t Soja + 30t Riz) si partiellement livré');
    
    // 4. Calcul total multi-produits
    const [totalMagasin] = await connection.query(`
      SELECT 
        COUNT(DISTINCT d.produit_id) as nombre_produits,
        COUNT(DISTINCT r.id) as total_rotations,
        SUM(r.quantite_livree) as total_livre_tousproduits
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      WHERE d.magasin_destination_id = 'plateforme-belair'
      AND r.statut IN ('livre', 'manquant')
    `);
    
    console.log('\n4. TOTAL MAGASIN (TOUS PRODUITS CONFONDUS):');
    console.log(`  - Nombre de produits différents: ${totalMagasin[0].nombre_produits}`);
    console.log(`  - Total rotations: ${totalMagasin[0].total_rotations}`);
    console.log(`  - Total réceptionné: ${totalMagasin[0].total_livre_tousproduits || 0}t`);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    connection.release();
    console.error('Erreur:', error);
    process.exit(1);
  }
}

testMultiProduits();