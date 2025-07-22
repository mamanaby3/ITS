const { pool } = require('../config/database-mysql');

// Fonction helper pour obtenir le nom du magasin
async function getMagasinName(magasinId) {
  try {
    const [result] = await pool.query('SELECT nom FROM magasins WHERE id = ?', [magasinId]);
    return result.length > 0 ? result[0].nom : null;
  } catch (error) {
    console.error('Erreur getMagasinName:', error);
    return null;
  }
}

// Récupérer tous les mouvements
exports.getAllMouvements = async (req, res) => {
  try {
    console.log('getAllMouvements called');
    console.log('req.user:', req.user);
    console.log('req.query:', req.query);
    
    const { magasin_id, type_mouvement, produit_id, date_debut, date_fin, limit = 50 } = req.query;
    let query = `
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
    `;
    
    const params = [];
    
    // Filtrer par magasin pour les opérateurs
    if (req.user && req.user.role === 'operator' && req.user.magasin_id) {
      query += ` AND (m.magasin_source_id = ? OR m.magasin_destination_id = ?)`;
      params.push(req.user.magasin_id, req.user.magasin_id);
    } else if (magasin_id) {
      query += ` AND (m.magasin_source_id = ? OR m.magasin_destination_id = ?)`;
      params.push(magasin_id, magasin_id);
    }
    
    if (type_mouvement) {
      query += ` AND m.type_mouvement = ?`;
      params.push(type_mouvement);
    }
    
    if (produit_id) {
      query += ` AND m.produit_id = ?`;
      params.push(produit_id);
    }
    
    if (date_debut && date_fin) {
      query += ` AND m.date_mouvement BETWEEN ? AND ?`;
      params.push(date_debut, date_fin);
    }
    
    query += ` ORDER BY m.date_mouvement DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [mouvements] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: mouvements
    });
    
  } catch (error) {
    console.error('Erreur getAllMouvements:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des mouvements',
      details: error.message
    });
  }
};

// Créer un nouveau mouvement
exports.createMouvement = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      type_mouvement,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      quantite,
      reference_document,
      description
    } = req.body;
    
    // Insérer le mouvement
    const [result] = await connection.execute(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_source_id, magasin_destination_id,
        quantite, reference_document, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      type_mouvement, produit_id, magasin_source_id, magasin_destination_id,
      quantite, reference_document, description, req.user.id
    ]);
    
    // Mettre à jour les stocks selon le type de mouvement
    if (type_mouvement === 'sortie' && magasin_source_id) {
      await connection.execute(`
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - ?,
            derniere_sortie = NOW()
        WHERE produit_id = ? AND magasin_id = ?
      `, [quantite, produit_id, magasin_source_id]);
    } else if (type_mouvement === 'entree' && magasin_destination_id) {
      await connection.execute(`
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        quantite_disponible = quantite_disponible + VALUES(quantite_disponible),
        derniere_entree = NOW()
      `, [produit_id, magasin_destination_id, quantite]);
    } else if (type_mouvement === 'dispatch') {
      // Pour un dispatch, on n'affecte pas le stock car ce n'est qu'une intention
      // Le stock ne sera affecté que lors de la confirmation (entrée) par le magasinier
      console.log('Mouvement de type dispatch enregistré - en attente de confirmation');
    } else if (type_mouvement === 'transfert') {
      // Sortie du magasin source
      await connection.execute(`
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - ?,
            derniere_sortie = NOW()
        WHERE produit_id = ? AND magasin_id = ?
      `, [quantite, produit_id, magasin_source_id]);
      
      // Entrée dans le magasin destination
      await connection.execute(`
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        quantite_disponible = quantite_disponible + VALUES(quantite_disponible),
        derniere_entree = NOW()
      `, [produit_id, magasin_destination_id, quantite]);
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Mouvement créé avec succès',
      data: { id: result.insertId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur createMouvement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du mouvement'
    });
  } finally {
    connection.release();
  }
};

module.exports = exports;