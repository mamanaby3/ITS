const { pool } = require('../config/database-mysql');

// Récupérer tous les magasins
exports.getAllMagasins = async (req, res) => {
  try {
    console.log('getAllMagasins MySQL controller called');
    
    const [magasins] = await pool.query(`
      SELECT 
        m.id,
        m.nom,
        m.ville,
        m.zone,
        m.adresse,
        m.capacite,
        m.telephone,
        m.responsable,
        m.capacite_max,
        m.created_at,
        m.updated_at,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id
      ORDER BY m.nom
    `);

    console.log(`Found ${magasins.length} magasins`);

    res.json({
      success: true,
      data: magasins
    });
  } catch (error) {
    console.error('Erreur getAllMagasins:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des magasins',
      details: error.message
    });
  }
};

// Récupérer un magasin par ID
exports.getMagasinById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [magasins] = await pool.query(
      'SELECT * FROM magasins WHERE id = ?',
      [id]
    );

    if (magasins.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Magasin non trouvé'
      });
    }

    // Récupérer les statistiques du magasin
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT produit_id) as nombre_produits,
        COALESCE(SUM(quantite_disponible), 0) as stock_total,
        COALESCE(SUM(quantite_disponible * valeur_unitaire), 0) as valeur_totale
      FROM stocks 
      WHERE magasin_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...magasins[0],
        stats: stats[0]
      }
    });
  } catch (error) {
    console.error('Erreur getMagasinById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du magasin'
    });
  }
};

// Récupérer le stock d'un magasin
exports.getMagasinStock = async (req, res) => {
  try {
    const { id } = req.params;

    const [stock] = await pool.query(`
      SELECT 
        s.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.unite,
        c.nom as categorie_nom
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE s.magasin_id = ? AND s.quantite_disponible > 0
      ORDER BY p.nom
    `, [id]);

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Erreur getMagasinStock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock du magasin'
    });
  }
};

module.exports = exports;