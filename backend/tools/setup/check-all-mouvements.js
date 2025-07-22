const { pool } = require('./config/database-mysql');

async function checkMouvements() {
  try {
    // Compter le total
    const [totalCount] = await pool.query('SELECT COUNT(*) as total FROM mouvements_stock');
    console.log('Total mouvements dans la base:', totalCount[0].total);
    
    // Compter par type
    const [byType] = await pool.query(`
      SELECT type_mouvement, COUNT(*) as count 
      FROM mouvements_stock 
      GROUP BY type_mouvement
    `);
    console.log('\nPar type:');
    byType.forEach(row => {
      console.log(`- ${row.type_mouvement}: ${row.count}`);
    });
    
    // Voir les derniers mouvements
    const [recent] = await pool.query(`
      SELECT id, type_mouvement, date_mouvement, reference_document, produit_id, magasin_destination_id
      FROM mouvements_stock 
      ORDER BY date_mouvement DESC 
      LIMIT 10
    `);
    console.log('\n10 derniers mouvements:');
    recent.forEach(m => {
      console.log(`ID ${m.id}: ${m.type_mouvement} - ${m.reference_document} - ${new Date(m.date_mouvement).toLocaleDateString()}`);
    });
    
    // Vérifier les filtres de date par défaut
    const dateDebut = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateFin = new Date().toISOString().split('T')[0];
    
    const [filtered] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM mouvements_stock 
      WHERE date_mouvement BETWEEN ? AND ?
    `, [dateDebut, dateFin]);
    
    console.log(`\nMouvements entre ${dateDebut} et ${dateFin}: ${filtered[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkMouvements();