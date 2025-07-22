const { pool } = require('../config/database-mysql');

// Créer un nouveau dispatch
exports.createDispatch = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const {
      numero_dispatch,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      client_id,
      quantite_totale,
      statut,
      notes
    } = req.body;

    const created_by = req.user.id;

    // Vérifier que le numéro de dispatch est unique
    const [existing] = await connection.query(
      'SELECT id FROM dispatches WHERE numero_dispatch = ?',
      [numero_dispatch]
    );

    if (existing.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Ce numéro de dispatch existe déjà'
      });
    }

    // Créer le dispatch
    const [result] = await connection.query(`
      INSERT INTO dispatches (
        numero_dispatch, produit_id, magasin_source_id, 
        magasin_destination_id, client_id, quantite_totale, 
        statut, notes, created_by, date_creation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      numero_dispatch,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      client_id || null,
      quantite_totale,
      statut || 'planifie',
      notes,
      created_by
    ]);

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Dispatch créé avec succès',
      data: {
        id: result.insertId,
        numero_dispatch
      }
    });
  } catch (error) {
    await connection.rollback();
    if (connection) connection.release();
    console.error('Erreur création dispatch:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du dispatch'
    });
  }
};

// Récupérer tous les dispatches
exports.getDispatches = async (req, res) => {
  try {
    const { magasin_id, statut, date_debut, date_fin } = req.query;
    
    let query = `
      SELECT 
        d.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        ms.nom as magasin_source_nom,
        md.nom as magasin_destination_nom,
        c.nom as client_nom,
        CONCAT(u.prenom, ' ', u.nom) as created_by_nom
      FROM dispatches d
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins ms ON d.magasin_source_id = ms.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN utilisateurs u ON d.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (magasin_id) {
      query += ' AND (d.magasin_source_id = ? OR d.magasin_destination_id = ?)';
      params.push(magasin_id, magasin_id);
    }

    if (statut) {
      query += ' AND d.statut = ?';
      params.push(statut);
    }

    if (date_debut && date_fin) {
      query += ' AND DATE(d.date_creation) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }

    query += ' ORDER BY d.date_creation DESC';

    const [dispatches] = await pool.query(query, params);

    res.json({
      success: true,
      data: dispatches
    });
  } catch (error) {
    console.error('Erreur récupération dispatches:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dispatches'
    });
  }
};

// Récupérer un dispatch par ID
exports.getDispatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [dispatches] = await pool.query(`
      SELECT 
        d.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.unite,
        ms.nom as magasin_source_nom,
        md.nom as magasin_destination_nom,
        c.nom as client_nom,
        CONCAT(u.prenom, ' ', u.nom) as created_by_nom
      FROM dispatches d
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins ms ON d.magasin_source_id = ms.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN utilisateurs u ON d.created_by = u.id
      WHERE d.id = ?
    `, [id]);

    if (dispatches.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch non trouvé'
      });
    }

    // Récupérer les rotations associées
    const [rotations] = await pool.query(`
      SELECT 
        r.*,
        c.nom as chauffeur_nom,
        c.numero_camion
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      WHERE r.dispatch_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...dispatches[0],
        rotations
      }
    });
  } catch (error) {
    console.error('Erreur récupération dispatch:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du dispatch'
    });
  }
};

// Mettre à jour le statut d'un dispatch
// Récupérer l'état de progression des dispatches
exports.getDispatchesProgress = async (req, res) => {
  try {
    const { magasin_id } = req.query;
    
    let query = `
      SELECT 
        d.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        ms.nom as magasin_source_nom,
        md.nom as magasin_destination_nom,
        c.nom as client_nom,
        COALESCE(SUM(r.quantite_prevue), 0) as total_livre,
        (d.quantite_totale - COALESCE(SUM(r.quantite_prevue), 0)) as reste_a_livrer,
        ((COALESCE(SUM(r.quantite_prevue), 0) / d.quantite_totale) * 100) as progression,
        COUNT(r.id) as nombre_rotations
      FROM dispatches d
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins ms ON d.magasin_source_id = ms.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN rotations r ON d.id = r.dispatch_id
      WHERE d.statut IN ('planifie', 'en_cours')
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }
    
    // Si l'utilisateur est operator, ne montrer que les dispatches vers son magasin
    if (req.user.role === 'operator' && req.user.magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(req.user.magasin_id);
    }
    
    query += ' GROUP BY d.id ORDER BY d.date_creation DESC';
    
    const [dispatches] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: dispatches
    });
  } catch (error) {
    console.error('Erreur récupération progression dispatches:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de la progression' 
    });
  }
};

exports.updateDispatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const [result] = await pool.query(
      'UPDATE dispatches SET statut = ? WHERE id = ?',
      [statut, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Statut du dispatch mis à jour'
    });
  } catch (error) {
    console.error('Erreur mise à jour dispatch:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du dispatch'
    });
  }
};