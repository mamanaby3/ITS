const db = require('../config/database-mysql');
const { validationResult } = require('express-validator');

// Récupérer tous les magasins
exports.getAllMagasins = async (req, res) => {
  try {
    const [magasins] = await db.execute(`
      SELECT 
        m.*,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id, m.nom, m.ville, m.zone, m.adresse, m.capacite, m.telephone, m.responsable, m.capacite_max, m.created_at, m.updated_at
      ORDER BY m.nom
    `);

    res.json({
      success: true,
      data: magasins
    });
  } catch (error) {
    console.error('Erreur récupération magasins:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
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
    
    const [magasins] = await db.execute(
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
    const [stats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT produit_id) as nombre_produits,
        COALESCE(SUM(quantite_disponible), 0) as stock_total,
        COALESCE(SUM(quantite_disponible * (SELECT prix_unitaire FROM produits WHERE id = stocks.produit_id)), 0) as valeur_totale
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
    console.error('Erreur récupération magasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du magasin'
    });
  }
};

// Créer un nouveau magasin
exports.createMagasin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id, nom, ville, zone, adresse, capacite } = req.body;

    await db.execute(
      `INSERT INTO magasins (id, nom, ville, zone, adresse, capacite) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nom, ville, zone, adresse, capacite]
    );

    res.status(201).json({
      success: true,
      message: 'Magasin créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création magasin:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Un magasin avec cet ID existe déjà'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du magasin'
    });
  }
};

// Mettre à jour un magasin
exports.updateMagasin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ville, zone, adresse, capacite } = req.body;

    const [result] = await db.execute(
      `UPDATE magasins 
       SET nom = ?, ville = ?, zone = ?, adresse = ?, capacite = ?
       WHERE id = ?`,
      [nom, ville, zone, adresse, capacite, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Magasin non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Magasin mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour magasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du magasin'
    });
  }
};

// Supprimer un magasin
exports.deleteMagasin = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a du stock dans ce magasin
    const [stock] = await db.execute(
      'SELECT COUNT(*) as count FROM stocks WHERE magasin_id = ? AND quantite_disponible > 0',
      [id]
    );

    if (stock[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un magasin contenant du stock'
      });
    }

    const [result] = await db.execute(
      'DELETE FROM magasins WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Magasin non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Magasin supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression magasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du magasin'
    });
  }
};

// Récupérer le stock d'un magasin
exports.getMagasinStock = async (req, res) => {
  try {
    const { id } = req.params;

    const [stock] = await db.execute(`
      SELECT 
        s.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.categorie as produit_categorie,
        p.unite
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      WHERE s.magasin_id = ? AND s.quantite_disponible > 0
      ORDER BY p.nom
    `, [id]);

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Erreur récupération stock magasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock du magasin'
    });
  }
};