// Test direct des controllers sans passer par HTTP
const { pool } = require('./config/database-mysql');

async function testMagasinsQuery() {
  console.log('Testing magasins query directly...\n');
  
  try {
    const query = `
      SELECT 
        m.*,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id
      ORDER BY m.nom
    `;
    
    console.log('Executing query:', query);
    const [magasins] = await pool.execute(query);
    
    console.log('Success! Found', magasins.length, 'magasins');
    console.log('First magasin:', magasins[0]);
    
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
    console.error('SQL:', error.sql);
  }
}

async function testMouvementsQuery() {
  console.log('\n\nTesting mouvements query directly...\n');
  
  try {
    const query = `
      SELECT 
        m.id,
        m.type_mouvement,
        m.date_mouvement,
        m.quantite,
        m.reference_document,
        p.nom AS produit,
        c.nom AS categorie,
        ms.nom AS magasin_origine,
        md.nom AS magasin_destination,
        cl.nom AS client,
        n.nom_navire,
        n.numero_imo,
        CONCAT(u.prenom, ' ', u.nom) AS operateur,
        u.role AS role_operateur,
        m.description AS observations
      FROM mouvements_stock m
      JOIN produits p ON m.produit_id = p.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN magasins ms ON m.magasin_source_id = ms.id
      LEFT JOIN magasins md ON m.magasin_destination_id = md.id
      LEFT JOIN clients cl ON m.client_id = cl.id
      LEFT JOIN navires n ON m.navire_id = n.id
      JOIN utilisateurs u ON m.created_by = u.id
      WHERE 1=1
      ORDER BY m.date_mouvement DESC 
      LIMIT 10
    `;
    
    console.log('Executing query...');
    const [mouvements] = await pool.execute(query);
    
    console.log('Success! Found', mouvements.length, 'mouvements');
    if (mouvements.length > 0) {
      console.log('First mouvement:', mouvements[0]);
    }
    
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
  }
}

async function runTests() {
  await testMagasinsQuery();
  await testMouvementsQuery();
  process.exit(0);
}

runTests();