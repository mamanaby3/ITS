const { pool } = require('./config/database-mysql');

async function checkStockData() {
  try {
    console.log('=== Vérification des données de stock ===\n');
    
    // 1. Compter les dispatches
    const [dispatches] = await pool.query(`
      SELECT COUNT(*) as total_dispatches 
      FROM navire_dispatching 
      WHERE magasin_id IS NOT NULL
    `);
    console.log(`Nombre total de dispatches vers magasins: ${dispatches[0].total_dispatches}`);
    
    // 2. Vérifier le stock par magasin
    const [stockParMagasin] = await pool.query(`
      SELECT 
        m.id as magasin_id,
        m.nom as magasin_nom,
        SUM(nd.quantite) as stock_magasin,
        COUNT(DISTINCT nc.produit_id) as nombre_produits,
        COUNT(DISTINCT nd.navire_id) as nombre_navires
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN magasins m ON nd.magasin_id = m.id
      WHERE nd.magasin_id IS NOT NULL
      GROUP BY m.id, m.nom
      ORDER BY m.nom
    `);
    
    console.log(`\nStock par magasin (${stockParMagasin.length} magasins):`);
    console.log('----------------------------------------');
    
    let totalGlobal = 0;
    stockParMagasin.forEach(magasin => {
      console.log(`${magasin.magasin_nom}: ${magasin.stock_magasin || 0} tonnes (${magasin.nombre_produits} produits, ${magasin.nombre_navires} navires)`);
      totalGlobal += parseFloat(magasin.stock_magasin || 0);
    });
    
    console.log('----------------------------------------');
    console.log(`Stock total global: ${totalGlobal} tonnes`);
    
    // 3. Vérifier s'il y a des magasins
    const [magasins] = await pool.query(`SELECT COUNT(*) as total FROM magasins`);
    console.log(`\nNombre de magasins dans la base: ${magasins[0].total}`);
    
    // 4. Vérifier les navires
    const [navires] = await pool.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN statut = 'dispatche' THEN 1 ELSE 0 END) as dispatches
      FROM navires
    `);
    console.log(`Nombre de navires: ${navires[0].total} (dont ${navires[0].dispatches} dispatchés)`);
    
    // 5. Afficher quelques exemples de dispatches
    const [exemplesDispatches] = await pool.query(`
      SELECT 
        nd.id,
        nd.quantite,
        nd.date_dispatching,
        m.nom as magasin,
        n.nom_navire
      FROM navire_dispatching nd
      JOIN magasins m ON nd.magasin_id = m.id
      JOIN navires n ON nd.navire_id = n.id
      WHERE nd.magasin_id IS NOT NULL
      ORDER BY nd.date_dispatching DESC
      LIMIT 5
    `);
    
    if (exemplesDispatches.length > 0) {
      console.log(`\nDerniers dispatches:`);
      console.log('----------------------------------------');
      exemplesDispatches.forEach(d => {
        console.log(`${d.date_dispatching} - ${d.navire} vers ${d.magasin}: ${d.quantite} tonnes`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkStockData();