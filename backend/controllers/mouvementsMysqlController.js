const { pool } = require('../config/database-mysql');

// Récupérer tous les mouvements
exports.getAllMouvements = async (req, res) => {
  try {
    console.log('getAllMouvements MySQL controller called');
    console.log('Query params:', req.query);
    
    const { magasin_id, type_mouvement, produit_id, date_debut, date_fin, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        m.id,
        m.type_mouvement,
        m.date_mouvement,
        m.quantite,
        m.reference_document,
        COALESCE(m.description, '') AS observations,
        m.navire_id,
        m.client_id,
        m.magasin_source_id,
        m.magasin_destination_id,
        p.nom AS produit,
        c.nom AS categorie,
        ms.nom AS magasin_origine,
        md.nom AS magasin_destination,
        cl.nom AS client,
        n.nom_navire,
        n.numero_imo,
        CONCAT(u.prenom, ' ', u.nom) AS operateur,
        u.role AS role_operateur
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
    
    // Filtrer par magasin
    if (magasin_id) {
      query += ` AND (m.magasin_source_id = ? OR m.magasin_destination_id = ?)`;
      params.push(magasin_id, magasin_id);
    }
    
    // Filtrer par type de mouvement
    if (type_mouvement) {
      query += ` AND m.type_mouvement = ?`;
      params.push(type_mouvement);
    }
    
    // Filtrer par produit
    if (produit_id) {
      query += ` AND m.produit_id = ?`;
      params.push(produit_id);
    }
    
    // Filtrer par dates (seulement si fournies)
    if (date_debut && date_fin) {
      query += ` AND m.date_mouvement BETWEEN ? AND ?`;
      params.push(date_debut, date_fin);
    } else if (date_debut) {
      query += ` AND m.date_mouvement >= ?`;
      params.push(date_debut);
    } else if (date_fin) {
      query += ` AND m.date_mouvement <= ?`;
      params.push(date_fin);
    }
    
    // Ordre et limite
    query += ` ORDER BY m.date_mouvement DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    console.log('Executing query with params:', params);
    
    const [mouvements] = await pool.query(query, params);
    
    console.log(`Found ${mouvements.length} mouvements`);
    
    res.json({
      success: true,
      data: mouvements
    });
    
  } catch (error) {
    console.error('Erreur getAllMouvements:', error);
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
        quantite, reference_document, description, created_by, date_mouvement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      type_mouvement, produit_id, magasin_source_id, magasin_destination_id,
      quantite, reference_document, description, req.user?.id || 1
    ]);
    
    // Le trigger s'occupe de mettre à jour les stocks automatiquement
    
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
      error: 'Erreur lors de la création du mouvement',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = exports;