const { pool } = require('../config/database-mysql');

async function checkRotations() {
  try {
    // Compter toutes les rotations
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM rotations');
    console.log('\n=== ROTATIONS DANS LA BASE ===');
    console.log('Total rotations:', countResult[0].total);

    // Afficher les 5 dernières rotations
    const [rotations] = await pool.query(`
      SELECT 
        r.id,
        r.numero_rotation,
        r.dispatch_id,
        r.quantite_prevue,
        r.quantite_livree,
        r.statut,
        r.created_at,
        d.numero_dispatch,
        d.magasin_destination_id
      FROM rotations r
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    console.log('\n=== DERNIÈRES ROTATIONS ===');
    rotations.forEach(rotation => {
      console.log(`- ${rotation.numero_rotation} (ID: ${rotation.id})`);
      console.log(`  Dispatch: ${rotation.numero_dispatch} (ID: ${rotation.dispatch_id})`);
      console.log(`  Magasin destination: ${rotation.magasin_destination_id}`);
      console.log(`  Quantité: ${rotation.quantite_prevue}t (livré: ${rotation.quantite_livree || 'N/A'})`);
      console.log(`  Statut: ${rotation.statut}`);
      console.log(`  Créé le: ${rotation.created_at}`);
      console.log('');
    });

    // Vérifier les dispatches
    const [dispatchCount] = await pool.query('SELECT COUNT(*) as total FROM dispatches');
    console.log('Total dispatches:', dispatchCount[0].total);

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkRotations();