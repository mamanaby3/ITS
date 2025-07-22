const { pool } = require('./config/database-mysql');

async function addTestStock() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Ajouter du stock pour plateforme-belair
    const stocks = [
      {
        produit_id: 60, // Soja
        magasin_id: 'plateforme-belair',
        quantite_disponible: 5000,
        quantite_reservee: 200,
        valeur_unitaire: 350
      },
      {
        produit_id: 61, // Riz
        magasin_id: 'plateforme-belair',
        quantite_disponible: 3000,
        quantite_reservee: 0,
        valeur_unitaire: 400
      }
    ];
    
    for (const stock of stocks) {
      await connection.execute(`
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, quantite_reservee, valeur_unitaire, derniere_entree)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          quantite_disponible = VALUES(quantite_disponible),
          quantite_reservee = VALUES(quantite_reservee),
          valeur_unitaire = VALUES(valeur_unitaire),
          derniere_entree = NOW()
      `, [
        stock.produit_id,
        stock.magasin_id,
        stock.quantite_disponible,
        stock.quantite_reservee,
        stock.valeur_unitaire
      ]);
    }
    
    await connection.commit();
    console.log('✅ Stock ajouté avec succès');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

addTestStock();