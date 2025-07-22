const { pool } = require('../config/database-mysql');

async function checkRotationsTotals() {
  try {
    console.log('=== CALCUL DES TOTAUX DES ROTATIONS PAR MAGASIN ===\n');

    // Récupérer les totaux par magasin
    const [totauxParMagasin] = await pool.query(`
      SELECT 
        d.magasin_destination_id,
        m.nom as magasin_nom,
        COUNT(DISTINCT r.id) as nombre_rotations,
        SUM(r.quantite_prevue) as total_prevu,
        SUM(r.quantite_livree) as total_livre,
        SUM(CASE WHEN r.statut IN ('livre', 'manquant') THEN r.quantite_livree ELSE 0 END) as total_receptionne
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN magasins m ON d.magasin_destination_id = m.id
      GROUP BY d.magasin_destination_id, m.nom
    `);

    console.log('RÉSUMÉ PAR MAGASIN:');
    console.log('===================');
    totauxParMagasin.forEach(magasin => {
      console.log(`\n${magasin.magasin_nom || magasin.magasin_destination_id}:`);
      console.log(`  - Nombre de rotations: ${magasin.nombre_rotations}`);
      console.log(`  - Total prévu: ${parseFloat(magasin.total_prevu).toFixed(2)} tonnes`);
      console.log(`  - Total livré: ${parseFloat(magasin.total_livre || 0).toFixed(2)} tonnes`);
      console.log(`  - Total réceptionné (livré + manquant): ${parseFloat(magasin.total_receptionne || 0).toFixed(2)} tonnes`);
    });

    // Détail des rotations
    console.log('\n\nDÉTAIL DES ROTATIONS:');
    console.log('====================');
    const [rotations] = await pool.query(`
      SELECT 
        r.numero_rotation,
        r.quantite_prevue,
        r.quantite_livree,
        r.statut,
        d.numero_dispatch,
        d.magasin_destination_id,
        m.nom as magasin_nom
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN magasins m ON d.magasin_destination_id = m.id
      ORDER BY d.magasin_destination_id, r.created_at DESC
    `);

    let currentMagasin = null;
    rotations.forEach(rotation => {
      if (currentMagasin !== rotation.magasin_destination_id) {
        currentMagasin = rotation.magasin_destination_id;
        console.log(`\n${rotation.magasin_nom || rotation.magasin_destination_id}:`);
      }
      console.log(`  - ${rotation.numero_rotation}: Prévu ${rotation.quantite_prevue}t, Livré ${rotation.quantite_livree || 'N/A'}t (${rotation.statut})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkRotationsTotals();