const { pool } = require('../config/database-mysql');

// Récupérer tous les chauffeurs
exports.getChauffeurs = async (req, res) => {
  try {
    const { magasin_id, statut } = req.query;
    let query = `
      SELECT 
        c.id,
        c.nom,
        c.telephone,
        c.numero_permis,
        c.numero_camion,
        c.actif,
        c.created_at,
        c.updated_at
      FROM chauffeurs c
      WHERE 1=1
    `;
    const params = [];

    if (statut) {
      const isActive = statut === 'actif' ? 1 : 0;
      query += ' AND c.actif = ?';
      params.push(isActive);
    }

    query += ' ORDER BY c.nom ASC';

    const [chauffeurs] = await pool.query(query, params);

    res.json({
      success: true,
      data: chauffeurs
    });
  } catch (error) {
    console.error('Erreur récupération chauffeurs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des chauffeurs' 
    });
  }
};

// Récupérer un chauffeur spécifique
exports.getChauffeur = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [chauffeurs] = await pool.query(`
      SELECT 
        c.*
      FROM chauffeurs c
      WHERE c.id = ?
    `, [id]);

    if (chauffeurs.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Chauffeur non trouvé' 
      });
    }

    // Récupérer les statistiques
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_rotations,
        SUM(quantite_prevue) as total_prevu,
        SUM(quantite_livree) as total_livre,
        SUM(ecart) as total_ecart,
        COUNT(CASE WHEN ecart > 0 THEN 1 END) as nombre_ecarts
      FROM rotations
      WHERE chauffeur_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        chauffeur: chauffeurs[0],
        statistiques: stats[0]
      }
    });
  } catch (error) {
    console.error('Erreur récupération chauffeur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du chauffeur' 
    });
  }
};

// Créer un nouveau chauffeur
exports.createChauffeur = async (req, res) => {
  try {
    const { nom, telephone, numero_permis, numero_camion } = req.body;

    // Vérifier si le numéro de permis existe déjà
    const [existing] = await pool.query(
      'SELECT id FROM chauffeurs WHERE numero_permis = ?',
      [numero_permis]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Ce numéro de permis existe déjà' 
      });
    }

    const [result] = await pool.query(`
      INSERT INTO chauffeurs (nom, telephone, numero_permis, numero_camion, actif)
      VALUES (?, ?, ?, ?, 1)
    `, [nom, telephone, numero_permis, numero_camion]);

    const [newChauffeur] = await pool.query(`
      SELECT 
        c.*
      FROM chauffeurs c
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Chauffeur créé avec succès',
      data: newChauffeur[0]
    });
  } catch (error) {
    console.error('Erreur création chauffeur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création du chauffeur' 
    });
  }
};

// Mettre à jour un chauffeur
exports.updateChauffeur = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, numero_permis, numero_camion, statut } = req.body;

    // Vérifier que le chauffeur existe
    const [chauffeur] = await pool.query('SELECT * FROM chauffeurs WHERE id = ?', [id]);
    if (chauffeur.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Chauffeur non trouvé' 
      });
    }

    // Vérifier l'unicité du numéro de permis si modifié
    if (numero_permis && numero_permis !== chauffeur[0].numero_permis) {
      const [existing] = await pool.query(
        'SELECT id FROM chauffeurs WHERE numero_permis = ? AND id != ?',
        [numero_permis, id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Ce numéro de permis existe déjà' 
        });
      }
    }

    // Construire la requête de mise à jour
    const updates = [];
    const values = [];

    if (nom) {
      updates.push('nom = ?');
      values.push(nom);
    }
    if (telephone) {
      updates.push('telephone = ?');
      values.push(telephone);
    }
    if (numero_permis) {
      updates.push('numero_permis = ?');
      values.push(numero_permis);
    }
    if (numero_camion) {
      updates.push('numero_camion = ?');
      values.push(numero_camion);
    }
    if (statut) {
      const isActive = statut === 'actif' ? 1 : 0;
      updates.push('actif = ?');
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée à mettre à jour' 
      });
    }

    values.push(id);
    await pool.query(
      `UPDATE chauffeurs SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedChauffeur] = await pool.query(`
      SELECT 
        c.*
      FROM chauffeurs c
      WHERE c.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Chauffeur mis à jour avec succès',
      data: updatedChauffeur[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour chauffeur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la mise à jour du chauffeur' 
    });
  }
};

// Supprimer un chauffeur (désactiver)
exports.deleteChauffeur = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le chauffeur existe
    const [chauffeur] = await pool.query('SELECT * FROM chauffeurs WHERE id = ?', [id]);
    if (chauffeur.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Chauffeur non trouvé' 
      });
    }

    // Vérifier s'il a des rotations en cours
    const [rotationsEnCours] = await pool.query(
      'SELECT COUNT(*) as count FROM rotations WHERE chauffeur_id = ? AND statut = "en_transit"',
      [id]
    );

    if (rotationsEnCours[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Impossible de désactiver ce chauffeur, il a des rotations en cours'
      });
    }

    // Désactiver le chauffeur
    await pool.query(
      'UPDATE chauffeurs SET actif = 0 WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true,
      message: 'Chauffeur désactivé avec succès' 
    });
  } catch (error) {
    console.error('Erreur suppression chauffeur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la désactivation du chauffeur' 
    });
  }
};