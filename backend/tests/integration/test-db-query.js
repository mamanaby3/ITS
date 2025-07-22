const { pool } = require('./config/database-mysql');

async function testQuery() {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check magasins table
    console.log('\n1. Testing magasins query:');
    const [magasins] = await pool.query('SELECT * FROM magasins LIMIT 5');
    console.log('Magasins found:', magasins.length);
    
    // Test 2: Check stocks table structure
    console.log('\n2. Testing stocks table structure:');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'its_maritime_stock' 
      AND TABLE_NAME = 'stocks'
    `);
    console.log('Stocks columns:', columns.map(c => c.COLUMN_NAME).join(', '));
    
    // Test 3: Check mouvements_stock table
    console.log('\n3. Testing mouvements_stock query:');
    const [mouvements] = await pool.query('SELECT COUNT(*) as count FROM mouvements_stock');
    console.log('Mouvements count:', mouvements[0].count);
    
    // Test 4: Test the actual magasins query
    console.log('\n4. Testing full magasins query:');
    const [result] = await pool.query(`
      SELECT 
        m.*,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id
      ORDER BY m.nom
      LIMIT 5
    `);
    console.log('Query successful, results:', result.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testQuery();