const { pool } = require('./config/database-mysql');

async function checkTableStructure() {
  try {
    // Vérifier la structure de mouvements_stock
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'its_maritime_stock' 
      AND TABLE_NAME = 'mouvements_stock'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Structure de la table mouvements_stock:');
    console.log('=====================================');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME} - ${col.DATA_TYPE} - ${col.IS_NULLABLE}`);
    });
    
    // Afficher quelques exemples de données
    console.log('\n\nExemples de données:');
    console.log('===================');
    const [samples] = await pool.query(`
      SELECT * FROM mouvements_stock 
      ORDER BY date_mouvement DESC 
      LIMIT 3
    `);
    
    samples.forEach((row, index) => {
      console.log(`\nEnregistrement ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null) {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkTableStructure();