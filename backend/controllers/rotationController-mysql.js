const { pool } = require('../config/database-mysql');

// Récupérer les rotations avec filtres
exports.getRotations = async (req, res) => {
  try {
    const { date, magasin_id, statut, dispatch_id } = req.query;
    console.log('=== GET ROTATIONS ===');
    console.log('Params reçus:', { date, magasin_id, statut, dispatch_id });
    console.log('User:', req.user.email, 'Role:', req.user.role, 'Magasin:', req.user.magasin_id);
    let query = `
      SELECT 
        r.id,
        r.numero_rotation,
        r.dispatch_id,
        r.chauffeur_id,
        r.quantite_prevue,
        r.quantite_livree,
        (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as ecart,
        r.date_arrivee,
        r.heure_arrivee,
        r.statut,
        r.notes as observations,
        r.reception_par,
        r.created_at,
        r.updated_at,
        c.nom as chauffeur_nom,
        c.numero_permis,
        c.numero_camion,
        d.numero_dispatch,
        d.quantite_totale as quantite_dispatch,
        d.produit_id,
        p.nom as produit_nom,
        p.reference as produit_reference,
        ms.nom as magasin_source_nom,
        md.nom as magasin_destination_nom,
        CONCAT(u.prenom, ' ', u.nom) as receptionnaire_nom
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins ms ON d.magasin_source_id = ms.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN utilisateurs u ON r.reception_par = u.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND DATE(r.date_arrivee) = ?';
      params.push(date);
    }

    if (statut) {
      query += ' AND r.statut = ?';
      params.push(statut);
    }

    // Filtrer par magasin
    if (magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    } else if (req.user.role === 'operator' && req.user.magasin_id) {
      // Les opérateurs ne voient que les rotations de leur magasin
      query += ' AND d.magasin_destination_id = ?';
      params.push(req.user.magasin_id);
    }
    // Les managers et admins voient toutes les rotations si pas de filtre magasin_id

    if (dispatch_id) {
      query += ' AND r.dispatch_id = ?';
      params.push(dispatch_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rotations] = await pool.query(query, params);

    res.json({
      success: true,
      data: rotations
    });
  } catch (error) {
    console.error('Erreur récupération rotations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rotations'
    });
  }
};

// Récupérer les rotations en transit
exports.getRotationsEnTransit = async (req, res) => {
  try {
    const { magasin_id } = req.query.params || {};
    
    let query = `
      SELECT 
        r.id,
        r.numero_rotation,
        r.dispatch_id,
        r.chauffeur_id,
        r.quantite_prevue,
        r.date_arrivee,
        r.heure_arrivee,
        r.statut,
        r.notes,
        r.created_at,
        c.nom as chauffeur_nom,
        c.numero_permis,
        c.numero_camion,
        c.telephone as chauffeur_telephone,
        d.numero_dispatch,
        d.quantite_totale as quantite_dispatch,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.unite,
        ms.nom as magasin_source_nom,
        md.nom as magasin_destination_nom
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins ms ON d.magasin_source_id = ms.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      WHERE r.statut IN ('en_transit', 'planifie')
    `;
    const params = [];

    if (magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rotations] = await pool.query(query, params);

    res.json({
      success: true,
      data: rotations
    });
  } catch (error) {
    console.error('Erreur récupération rotations en transit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rotations en transit'
    });
  }
};

// Calculer le nombre de rotations nécessaires
exports.calculateRotations = async (req, res) => {
  try {
    const { dispatch_id, quantite_totale, chauffeurs_disponibles } = req.body;

    // Récupérer les chauffeurs avec leur capacité
    let chauffeursQuery = `
      SELECT id, nom, numero_camion, capacite_camion 
      FROM chauffeurs 
      WHERE statut = 'actif'
    `;
    const params = [];
    
    if (chauffeurs_disponibles && chauffeurs_disponibles.length > 0) {
      chauffeursQuery += ' AND id IN (?)';
      params.push(chauffeurs_disponibles);
    }
    
    const [chauffeurs] = await pool.query(chauffeursQuery, params);
    
    if (chauffeurs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun chauffeur disponible'
      });
    }
    
    // Calculer les rotations optimales
    const rotations = [];
    let quantiteRestante = quantite_totale;
    let chauffeurIndex = 0;
    
    while (quantiteRestante > 0) {
      const chauffeur = chauffeurs[chauffeurIndex % chauffeurs.length];
      const quantiteRotation = Math.min(quantiteRestante, chauffeur.capacite_camion);
      
      rotations.push({
        chauffeur_id: chauffeur.id,
        chauffeur_nom: chauffeur.nom,
        numero_camion: chauffeur.numero_camion,
        capacite_camion: chauffeur.capacite_camion,
        quantite_prevue: quantiteRotation,
        numero_rotation: rotations.length + 1
      });
      
      quantiteRestante -= quantiteRotation;
      chauffeurIndex++;
    }
    
    res.json({
      success: true,
      data: {
        nombre_rotations: rotations.length,
        rotations,
        quantite_totale,
        message: `${rotations.length} rotation(s) nécessaire(s) pour transporter ${quantite_totale} tonnes`
      }
    });
  } catch (error) {
    console.error('Erreur calcul rotations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des rotations'
    });
  }
};

// Créer plusieurs rotations en une fois
exports.createMultipleRotations = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { dispatch_id, rotations } = req.body;

    // Vérifier que le dispatch existe
    const [dispatch] = await connection.query(
      'SELECT * FROM dispatches WHERE id = ? AND statut NOT IN ("complete", "annule")',
      [dispatch_id]
    );

    if (dispatch.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Dispatch non trouvé ou déjà complètement livré'
      });
    }

    const createdRotations = [];
    
    // Créer chaque rotation
    for (const [index, rotation] of rotations.entries()) {
      const numeroRotation = `ROT-${Date.now()}-${dispatch_id}-${index + 1}`;
      
      const [result] = await connection.query(`
        INSERT INTO rotations (
          numero_rotation, dispatch_id, chauffeur_id, quantite_prevue, 
          date_arrivee, heure_arrivee, statut, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'planifie', ?, NOW(), NOW())
      `, [
        numeroRotation, 
        dispatch_id, 
        rotation.chauffeur_id, 
        rotation.quantite_prevue, 
        rotation.date_arrivee || null,
        rotation.heure_arrivee || null,
        rotation.observations || null
      ]);
      
      createdRotations.push({
        id: result.insertId,
        numero_rotation: numeroRotation,
        ...rotation
      });
    }

    // Mettre à jour le statut du dispatch
    await connection.query(
      'UPDATE dispatches SET statut = "en_cours" WHERE id = ?',
      [dispatch_id]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: `${createdRotations.length} rotation(s) créée(s) avec succès`,
      data: createdRotations
    });
  } catch (error) {
    await connection.rollback();
    if (connection) connection.release();
    console.error('Erreur création rotations multiples:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création des rotations'
    });
  }
};

// Créer une nouvelle rotation
exports.createRotation = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const {
      dispatch_id,
      chauffeur_id,
      quantite_prevue,
      date_arrivee,
      heure_arrivee,
      observations
    } = req.body;

    // Vérifier que le dispatch existe et n'est pas déjà complètement livré
    const [dispatch] = await connection.query(
      'SELECT * FROM dispatches WHERE id = ? AND statut NOT IN ("complete", "annule")',
      [dispatch_id]
    );

    if (dispatch.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Dispatch non trouvé ou déjà complètement livré'
      });
    }

    // Créer la rotation
    const numeroRotation = `ROT-${Date.now()}-${dispatch_id}`;
    const [result] = await connection.query(`
      INSERT INTO rotations (
        numero_rotation, dispatch_id, chauffeur_id, quantite_prevue, 
        date_arrivee, heure_arrivee, statut, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'planifie', ?, NOW(), NOW())
    `, [numeroRotation, dispatch_id, chauffeur_id, quantite_prevue, date_arrivee, heure_arrivee, observations]);

    await connection.commit();
    connection.release();

    // Récupérer la rotation créée avec toutes les informations
    const [newRotation] = await pool.query(`
      SELECT 
        r.*,
        c.nom as chauffeur_nom,
        d.numero_dispatch,
        p.nom as produit_nom
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN produits p ON d.produit_id = p.id
      WHERE r.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Rotation créée avec succès',
      data: newRotation[0]
    });
  } catch (error) {
    await connection.rollback();
    if (connection) connection.release();
    console.error('Erreur création rotation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la rotation'
    });
  }
};

// Réceptionner une rotation
exports.receiveRotation = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { rotation_id } = req.params;
    const { quantite_livree, observations } = req.body;
    const reception_par = req.user.id;

    // Récupérer la rotation et les informations associées
    const [rotationData] = await connection.query(`
      SELECT 
        r.*,
        d.quantite_totale as quantite_dispatch,
        d.magasin_destination_id,
        d.produit_id,
        d.id as dispatch_id
      FROM rotations r
      JOIN dispatches d ON r.dispatch_id = d.id
      WHERE r.id = ? AND r.statut IN ('en_transit', 'planifie')
    `, [rotation_id]);

    if (rotationData.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Rotation non trouvée ou déjà réceptionnée'
      });
    }

    const rotation = rotationData[0];
    const ecart = rotation.quantite_prevue - quantite_livree;

    // Mettre à jour la rotation
    await connection.query(`
      UPDATE rotations 
      SET quantite_livree = ?, statut = 'livre', 
          reception_par = ?, notes = ?, updated_at = NOW()
      WHERE id = ?
    `, [quantite_livree, reception_par, observations, rotation_id]);

    // Créer le mouvement de stock
    await connection.query(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id,
        quantite, reference_document,
        date_mouvement, description, created_by
      ) VALUES (
        'entree', ?, ?, ?, ?, NOW(), ?, ?
      )
    `, [
      rotation.produit_id,
      rotation.magasin_destination_id,
      quantite_livree,
      `ROT-${rotation_id}`,
      observations || 'Réception de rotation',
      reception_par
    ]);

    // Vérifier si toutes les rotations du dispatch sont livrées
    const [rotationsRestantes] = await connection.query(
      'SELECT COUNT(*) as count FROM rotations WHERE dispatch_id = ? AND statut IN ("en_transit", "planifie")',
      [rotation.dispatch_id]
    );

    if (rotationsRestantes[0].count === 0) {
      // Toutes les rotations sont livrées, mettre à jour le statut du dispatch
      const [totalLivre] = await connection.query(
        'SELECT SUM(quantite_livree) as total FROM rotations WHERE dispatch_id = ?',
        [rotation.dispatch_id]
      );

      const nouveauStatut = totalLivre[0].total >= rotation.quantite_dispatch ? 'livre' : 'partiel';
      
      await connection.query(
        'UPDATE dispatches SET statut = ? WHERE id = ?',
        [nouveauStatut, rotation.dispatch_id]
      );
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: ecart > 0 
        ? `Rotation réceptionnée avec un écart de ${ecart} tonnes`
        : 'Rotation réceptionnée avec succès',
      data: {
        quantite_prevue: rotation.quantite_prevue,
        quantite_livree,
        ecart
      }
    });
  } catch (error) {
    await connection.rollback();
    if (connection) connection.release();
    console.error('Erreur réception rotation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réception de la rotation'
    });
  }
};

// Récupérer l'historique des rotations
exports.getRotationsHistory = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id } = req.query;
    
    let query = `
      SELECT 
        r.*,
        (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as ecart,
        c.nom as chauffeur_nom,
        c.numero_permis,
        c.numero_camion,
        d.numero_dispatch,
        p.nom as produit_nom,
        p.reference as produit_reference,
        md.nom as magasin_destination_nom,
        CONCAT(u.prenom, ' ', u.nom) as receptionnaire_nom
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN utilisateurs u ON r.reception_par = u.id
      WHERE r.statut = 'livre'
    `;
    const params = [];

    if (date_debut && date_fin) {
      query += ' AND DATE(r.date_arrivee) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }

    if (magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }

    query += ' ORDER BY r.date_arrivee DESC, r.updated_at DESC';

    const [rotations] = await pool.query(query, params);

    res.json({
      success: true,
      data: rotations
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// Rapport des écarts
exports.getEcartsReport = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id } = req.query;
    
    let query = `
      SELECT 
        r.*,
        (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as ecart,
        c.nom as chauffeur_nom,
        c.numero_permis,
        d.numero_dispatch,
        p.nom as produit_nom,
        md.nom as magasin_destination_nom,
        CONCAT(u.prenom, ' ', u.nom) as receptionnaire_nom
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      LEFT JOIN dispatches d ON r.dispatch_id = d.id
      LEFT JOIN produits p ON d.produit_id = p.id
      LEFT JOIN magasins md ON d.magasin_destination_id = md.id
      LEFT JOIN utilisateurs u ON r.reception_par = u.id
      WHERE (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) > 0 AND r.statut = 'livre'
    `;
    const params = [];

    if (date_debut && date_fin) {
      query += ' AND DATE(r.date_arrivee) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }

    if (magasin_id) {
      query += ' AND d.magasin_destination_id = ?';
      params.push(magasin_id);
    }

    const [ecarts] = await pool.query(query, params);

    // Statistiques par chauffeur
    let statsQuery = `
      SELECT 
        c.id,
        c.nom as chauffeur_nom,
        COUNT(*) as nombre_ecarts,
        SUM(r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as total_ecart,
        AVG(r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as ecart_moyen
      FROM rotations r
      JOIN chauffeurs c ON r.chauffeur_id = c.id
      JOIN dispatches d ON r.dispatch_id = d.id
      WHERE (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) > 0 AND r.statut = 'livre'
    `;

    if (date_debut && date_fin) {
      statsQuery += ' AND DATE(r.date_arrivee) BETWEEN ? AND ?';
    }

    if (magasin_id) {
      statsQuery += ' AND d.magasin_destination_id = ?';
    }

    statsQuery += ' GROUP BY c.id, c.nom ORDER BY total_ecart DESC';

    const [statistiques] = await pool.query(statsQuery, params);

    res.json({
      success: true,
      data: {
        ecarts,
        statistiques
      }
    });
  } catch (error) {
    console.error('Erreur rapport écarts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du rapport d\'écarts'
    });
  }
};

// Démarrer une rotation (la passer en transit)
exports.startRotation = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { rotation_id } = req.params;

    // Vérifier que la rotation existe et est planifiée
    const [rotation] = await connection.query(
      'SELECT * FROM rotations WHERE id = ? AND statut = "planifie"',
      [rotation_id]
    );

    if (rotation.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Rotation non trouvée ou déjà en transit'
      });
    }

    // Mettre à jour le statut en transit
    await connection.query(
      'UPDATE rotations SET statut = "en_transit", updated_at = NOW() WHERE id = ?',
      [rotation_id]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Rotation démarrée avec succès'
    });
  } catch (error) {
    await connection.rollback();
    if (connection) connection.release();
    console.error('Erreur démarrage rotation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage de la rotation'
    });
  }
};

// Récupérer les rotations d'un dispatch
exports.getRotationsByDispatch = async (req, res) => {
  try {
    const { dispatch_id } = req.params;
    
    const [rotations] = await pool.query(`
      SELECT 
        r.*,
        (r.quantite_prevue - COALESCE(r.quantite_livree, 0)) as ecart,
        c.nom as chauffeur_nom,
        c.numero_camion,
        c.capacite_camion
      FROM rotations r
      LEFT JOIN chauffeurs c ON r.chauffeur_id = c.id
      WHERE r.dispatch_id = ?
      ORDER BY r.created_at ASC
    `, [dispatch_id]);

    // Calculer le résumé
    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_rotations,
        COUNT(CASE WHEN statut = 'planifie' THEN 1 END) as rotations_planifiees,
        COUNT(CASE WHEN statut = 'en_transit' THEN 1 END) as rotations_en_transit,
        COUNT(CASE WHEN statut = 'livre' THEN 1 END) as rotations_livrees,
        SUM(quantite_prevue) as total_prevu,
        SUM(COALESCE(quantite_livree, 0)) as total_livre
      FROM rotations
      WHERE dispatch_id = ?
    `, [dispatch_id]);

    res.json({
      success: true,
      data: {
        rotations,
        summary: summary[0]
      }
    });
  } catch (error) {
    console.error('Erreur récupération rotations dispatch:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rotations'
    });
  }
};