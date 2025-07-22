const { pool } = require('../config/database-mysql');

async function testStockCalculation() {
  try {
    const magasin_id = 'plateforme-belair'; // Tester avec Plateforme Belair
    
    console.log(`=== TEST CALCUL STOCK POUR ${magasin_id} ===\n`);

    // 1. Total des rotations livrées
    const [totalRotations] = await pool.query(`
      SELECT 
        d.produit_id,
        p.nom as produit_nom,
        COUNT(r.id) as nombre_rotations,
        SUM(r.quantite_prevue) as total_prevu,
        SUM(r.quantite_livree) as total_livre
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      JOIN produits p ON d.produit_id = p.id
      WHERE d.magasin_destination_id = ?
      AND r.statut IN ('livre', 'manquant')
      GROUP BY d.produit_id, p.nom
    `, [magasin_id]);

    console.log('ROTATIONS PAR PRODUIT:');
    totalRotations.forEach(row => {
      console.log(`- ${row.produit_nom}: ${row.nombre_rotations} rotations, ${row.total_livre || 0}t livrées`);
    });

    // 2. Total général des rotations
    const [totalGeneral] = await pool.query(`
      SELECT COALESCE(SUM(r.quantite_livree), 0) as total_livre
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      WHERE d.magasin_destination_id = ?
      AND r.statut IN ('livre', 'manquant')
    `, [magasin_id]);

    console.log(`\nTOTAL GÉNÉRAL RÉCEPTIONNÉ: ${totalGeneral[0].total_livre}t`);

    // 3. Détail des rotations
    const [rotations] = await pool.query(`
      SELECT 
        r.numero_rotation,
        r.quantite_prevue,
        r.quantite_livree,
        r.statut,
        d.numero_dispatch,
        p.nom as produit_nom
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      JOIN produits p ON d.produit_id = p.id
      WHERE d.magasin_destination_id = ?
      ORDER BY r.created_at DESC
    `, [magasin_id]);

    console.log('\nDÉTAIL DES ROTATIONS:');
    rotations.forEach(r => {
      console.log(`- ${r.numero_rotation}: ${r.produit_nom}, Prévu: ${r.quantite_prevue}t, Livré: ${r.quantite_livree || 'N/A'}t (${r.statut})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

testStockCalculation();