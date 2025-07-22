const { pool } = require('./config/database-mysql');

async function insertTestData() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insérer quelques mouvements de test de différents types
    const testMouvements = [
      {
        type_mouvement: 'entree',
        produit_id: 60, // Soja
        magasin_source_id: null,
        magasin_destination_id: 'belair-garage',
        quantite: 1000,
        reference_document: 'TEST-ENT-001',
        description: 'Test entrée en stock',
        created_by: 1
      },
      {
        type_mouvement: 'sortie',
        produit_id: 61, // Riz
        magasin_source_id: 'plateforme-belair',
        magasin_destination_id: null,
        quantite: 500,
        reference_document: 'TEST-SOR-001',
        description: 'Test sortie de stock',
        client_id: 1,
        created_by: 1
      },
      {
        type_mouvement: 'transfert',
        produit_id: 60, // Soja
        magasin_source_id: 'belair-garage',
        magasin_destination_id: 'plateforme-belair',
        quantite: 300,
        reference_document: 'TEST-TRA-001',
        description: 'Test transfert entre magasins',
        created_by: 1
      }
    ];
    
    for (const mouvement of testMouvements) {
      await connection.execute(`
        INSERT INTO mouvements_stock (
          type_mouvement, produit_id, magasin_source_id, magasin_destination_id,
          quantite, reference_document, description, client_id, created_by, date_mouvement
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        mouvement.type_mouvement,
        mouvement.produit_id,
        mouvement.magasin_source_id,
        mouvement.magasin_destination_id,
        mouvement.quantite,
        mouvement.reference_document,
        mouvement.description,
        mouvement.client_id || null,
        mouvement.created_by
      ]);
    }
    
    await connection.commit();
    console.log('✅ Mouvements de test insérés avec succès');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

insertTestData();