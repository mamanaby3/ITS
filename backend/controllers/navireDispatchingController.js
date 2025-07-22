const { pool } = require('../config/database-mysql');

// Récupérer les dispatches en attente pour un magasin
exports.getDispatchesEnAttente = async (req, res) => {
  try {
    console.log('=== DISPATCHES EN ATTENTE ===');
    console.log('User:', req.user.email, 'Role:', req.user.role, 'Magasin ID:', req.user.magasin_id);
    
    let magasin_id;
    
    // Pour les opérateurs, utiliser leur magasin assigné
    if (req.user.role === 'operator') {
      if (!req.user.magasin_id) {
        return res.status(403).json({ 
          success: false,
          error: 'Aucun magasin assigné à cet opérateur' 
        });
      }
      magasin_id = req.user.magasin_id;
    } else {
      // Pour les autres rôles, permettre de spécifier le magasin
      magasin_id = req.query.magasin_id || req.user.magasin_id;
    }
    
    if (!magasin_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Magasin ID requis' 
      });
    }
    
    console.log('Recherche des dispatches pour le magasin:', magasin_id);
    
    const query = `
      SELECT 
        nd.id as dispatch_id,
        nd.quantite,
        nd.date_dispatching,
        nd.numero_camion,
        nd.transporteur,
        nd.chauffeur_nom,
        nd.observations,
        nd.statut,
        nd.quantite_recue,
        nd.date_reception,
        nd.ecart_quantite,
        nd.observations_reception,
        n.nom_navire,
        n.numero_imo,
        n.date_arrivee,
        p.nom as produit_nom,
        p.reference as produit_reference,
        nc.unite,
        m.nom as magasin_nom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN navires n ON nd.navire_id = n.id
      JOIN produits p ON nc.produit_id = p.id
      JOIN magasins m ON nd.magasin_id = m.id
      WHERE nd.magasin_id = ?
      AND nd.statut = 'en_attente'
      ORDER BY nd.date_dispatching DESC
    `;
    
    const [dispatches] = await pool.query(query, [magasin_id]);
    
    console.log(`${dispatches.length} dispatches en attente trouvés`);
    
    res.json({
      success: true,
      data: dispatches
    });
    
  } catch (error) {
    console.error('Erreur récupération dispatches en attente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des dispatches' 
    });
  }
};

// Réceptionner un dispatch
exports.receptionnerDispatch = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const { dispatch_id } = req.params;
    const {
      quantite_recue,
      observations_reception
    } = req.body;
    
    console.log('=== RECEPTION DISPATCH ===');
    console.log('Dispatch ID:', dispatch_id, 'Quantité reçue:', quantite_recue);
    
    // Vérifier que le dispatch existe et appartient au magasin de l'opérateur
    const [dispatchRows] = await connection.query(`
      SELECT 
        nd.*,
        nc.produit_id,
        p.nom as produit_nom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      WHERE nd.id = ?
    `, [dispatch_id]);
    
    if (dispatchRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Dispatch non trouvé' 
      });
    }
    
    const dispatch = dispatchRows[0];
    
    // Vérifier que l'opérateur a accès à ce magasin
    if (req.user.role === 'operator' && dispatch.magasin_id !== req.user.magasin_id) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({ 
        success: false,
        error: 'Accès non autorisé à ce dispatch' 
      });
    }
    
    // Vérifier que le dispatch est en attente
    if (dispatch.statut !== 'en_attente') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: 'Ce dispatch a déjà été réceptionné' 
      });
    }
    
    // Calculer l'écart
    const ecart = quantite_recue - dispatch.quantite;
    const ecart_pourcentage = (ecart / dispatch.quantite) * 100;
    
    console.log('Écart calculé:', ecart, 'tonnes (', ecart_pourcentage.toFixed(2), '%)');
    
    // Mettre à jour le dispatch
    await connection.query(`
      UPDATE navire_dispatching
      SET 
        statut = 'receptionne',
        quantite_recue = ?,
        date_reception = NOW(),
        reception_par = ?,
        ecart_quantite = ?,
        observations_reception = ?
      WHERE id = ?
    `, [quantite_recue, req.user.id, ecart, observations_reception, dispatch_id]);
    
    // Créer le mouvement d'entrée
    await connection.query(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id,
        quantite, reference_document, navire_id,
        date_mouvement, description, created_by
      ) VALUES (
        'entree', ?, ?, ?, ?, ?, NOW(), ?, ?
      )
    `, [
      dispatch.produit_id,
      dispatch.magasin_id,
      quantite_recue,
      `REC-DISP-${dispatch_id}`,
      dispatch.navire_id,
      `Réception dispatch - ${dispatch.produit_nom} - Écart: ${ecart >= 0 ? '+' : ''}${ecart.toFixed(2)} tonnes`,
      req.user.id
    ]);
    
    // Le trigger s'occupe de mettre à jour la table stocks automatiquement
    
    await connection.commit();
    connection.release();
    
    console.log('Réception enregistrée avec succès');
    
    res.json({
      success: true,
      message: 'Dispatch réceptionné avec succès',
      data: {
        dispatch_id,
        quantite_prevue: dispatch.quantite,
        quantite_recue,
        ecart,
        ecart_pourcentage: ecart_pourcentage.toFixed(2)
      }
    });
    
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Erreur réception dispatch:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la réception du dispatch' 
    });
  }
};

// Historique des réceptions
exports.getHistoriqueReceptions = async (req, res) => {
  try {
    let magasin_id;
    
    if (req.user.role === 'operator') {
      magasin_id = req.user.magasin_id;
    } else {
      magasin_id = req.query.magasin_id;
    }
    
    let query = `
      SELECT 
        nd.id as dispatch_id,
        nd.quantite as quantite_prevue,
        nd.quantite_recue,
        nd.ecart_quantite,
        nd.date_dispatching,
        nd.date_reception,
        nd.numero_camion,
        nd.transporteur,
        nd.chauffeur_nom,
        nd.observations_reception,
        n.nom_navire,
        n.numero_imo,
        p.nom as produit_nom,
        p.reference as produit_reference,
        nc.unite,
        m.nom as magasin_nom,
        u.nom as receptionnaire_nom,
        u.prenom as receptionnaire_prenom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN navires n ON nd.navire_id = n.id
      JOIN produits p ON nc.produit_id = p.id
      JOIN magasins m ON nd.magasin_id = m.id
      LEFT JOIN utilisateurs u ON nd.reception_par = u.id
      WHERE nd.statut = 'receptionne'
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ` AND nd.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY nd.date_reception DESC`;
    
    const [receptions] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: receptions
    });
    
  } catch (error) {
    console.error('Erreur historique réceptions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
};

// Récupérer l'historique des dispatches d'un magasin
exports.getHistoriqueDispatches = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id } = req.query;
    let query = `
      SELECT 
        nd.id as dispatch_id,
        nd.quantite,
        nd.date_dispatching,
        nd.numero_camion,
        nd.transporteur,
        nd.chauffeur_nom,
        nd.statut,
        n.nom_navire,
        p.nom as produit_nom,
        m.nom as magasin_nom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN navires n ON nd.navire_id = n.id
      JOIN produits p ON nc.produit_id = p.id
      JOIN magasins m ON nd.magasin_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date_debut && date_fin) {
      query += ` AND nd.date_dispatching BETWEEN ? AND ?`;
      params.push(date_debut, date_fin);
    }
    
    if (magasin_id) {
      query += ` AND nd.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY nd.date_dispatching DESC`;
    
    const [dispatches] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: dispatches
    });
    
  } catch (error) {
    console.error('Erreur historique dispatches:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
};

// Rapport des écarts
exports.getRapportEcarts = async (req, res) => {
  try {
    const { date_debut, date_fin, magasin_id } = req.query;
    
    let query = `
      SELECT 
        nd.id as dispatch_id,
        nd.quantite as quantite_prevue,
        nd.quantite_recue,
        nd.ecart_quantite,
        ((nd.ecart_quantite / nd.quantite) * 100) as ecart_pourcentage,
        nd.date_dispatching,
        nd.date_reception,
        nd.observations_reception,
        n.nom_navire,
        p.nom as produit_nom,
        m.nom as magasin_nom,
        u.nom as receptionnaire_nom,
        u.prenom as receptionnaire_prenom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN navires n ON nd.navire_id = n.id
      JOIN produits p ON nc.produit_id = p.id
      JOIN magasins m ON nd.magasin_id = m.id
      LEFT JOIN utilisateurs u ON nd.reception_par = u.id
      WHERE nd.statut = 'receptionne'
      AND nd.ecart_quantite IS NOT NULL
    `;
    
    const params = [];
    
    if (date_debut && date_fin) {
      query += ` AND nd.date_reception BETWEEN ? AND ?`;
      params.push(date_debut, date_fin);
    }
    
    if (magasin_id) {
      query += ` AND nd.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY ABS(nd.ecart_quantite) DESC`;
    
    const [ecarts] = await pool.query(query, params);
    
    // Calculer les statistiques
    const stats = {
      nombre_receptions: ecarts.length,
      total_prevu: ecarts.reduce((sum, e) => sum + e.quantite_prevue, 0),
      total_recu: ecarts.reduce((sum, e) => sum + e.quantite_recue, 0),
      ecart_total: ecarts.reduce((sum, e) => sum + e.ecart_quantite, 0),
      ecarts_positifs: ecarts.filter(e => e.ecart_quantite > 0).length,
      ecarts_negatifs: ecarts.filter(e => e.ecart_quantite < 0).length,
      ecarts_nuls: ecarts.filter(e => e.ecart_quantite === 0).length
    };
    
    res.json({
      success: true,
      data: {
        ecarts,
        stats
      }
    });
    
  } catch (error) {
    console.error('Erreur rapport écarts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la génération du rapport' 
    });
  }
};

// Récupérer les totaux du magasin
exports.getTotauxMagasin = async (req, res) => {
  try {
    console.log('=== TOTAUX MAGASIN ===');
    console.log('User:', req.user.email, 'Role:', req.user.role, 'Magasin ID:', req.user.magasin_id);
    
    let magasin_id;
    
    if (req.user.role === 'operator') {
      if (!req.user.magasin_id) {
        return res.status(403).json({ 
          success: false,
          error: 'Aucun magasin assigné à cet opérateur' 
        });
      }
      magasin_id = req.user.magasin_id;
    } else {
      magasin_id = req.query.magasin_id || req.user.magasin_id;
    }
    
    if (!magasin_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Magasin ID requis' 
      });
    }
    
    // Requête pour obtenir les totaux du stock depuis la table stocks
    const [totaux] = await pool.query(`
      SELECT 
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total,
        COUNT(DISTINCT s.produit_id) as nombre_produits
      FROM stocks s
      WHERE s.magasin_id = ?
      AND s.quantite_disponible > 0
    `, [magasin_id]);
    
    res.json({
      success: true,
      data: {
        magasin_id,
        totaux: {
          stock_total: parseFloat(totaux[0].stock_total || 0),
          nombre_produits: parseInt(totaux[0].nombre_produits || 0)
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération totaux magasin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des totaux' 
    });
  }
};

// Récupérer le stock du magasin depuis la table stocks
exports.getStockMagasin = async (req, res) => {
  try {
    console.log('=== STOCK MAGASIN DEPUIS TABLE STOCKS ===');
    console.log('User:', req.user.email, 'Role:', req.user.role, 'Magasin ID:', req.user.magasin_id);
    
    let magasin_id;
    
    // Pour les opérateurs, utiliser leur magasin assigné
    if (req.user.role === 'operator') {
      if (!req.user.magasin_id) {
        return res.status(403).json({ 
          success: false,
          error: 'Aucun magasin assigné à cet opérateur' 
        });
      }
      magasin_id = req.user.magasin_id;
    } else {
      // Pour les autres rôles, permettre de spécifier le magasin
      magasin_id = req.query.magasin_id || req.user.magasin_id;
    }
    
    if (!magasin_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Magasin ID requis' 
      });
    }
    
    // Requête pour récupérer le stock depuis la table stocks
    const query = `
      SELECT 
        s.id,
        s.produit_id,
        s.magasin_id,
        s.quantite_disponible as stock_total,
        s.quantite_disponible,
        s.quantite_reservee,
        s.derniere_entree,
        s.derniere_sortie,
        p.nom as produit_nom,
        p.reference,
        p.categorie,
        p.unite,
        p.seuil_alerte,
        m.nom as magasin_nom,
        -- Calculer si le stock est bas
        CASE 
          WHEN s.quantite_disponible <= p.seuil_alerte THEN true
          ELSE false
        END as stock_faible
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE s.magasin_id = ?
      ORDER BY p.nom ASC
    `;
    
    const [stocks] = await pool.query(query, [magasin_id]);
    
    console.log(`${stocks.length} produits en stock trouvés`);
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur récupération stock magasin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du stock' 
    });
  }
};

// Récupérer le stock total global de tous les magasins
exports.getStockTotalTousMagasins = async (req, res) => {
  try {
    console.log('=== STOCK TOTAL TOUS MAGASINS ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    
    // Requête pour obtenir le stock total global depuis la table stocks (incluant les stocks à 0)
    const [stockTotalResult] = await pool.query(`
      SELECT 
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total_global
      FROM stocks s
    `);
    
    // Requête pour obtenir le stock par magasin (incluant les stocks à 0)
    const [stockParMagasinResult] = await pool.query(`
      SELECT 
        m.id as magasin_id,
        m.nom as magasin_nom,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_magasin,
        COUNT(DISTINCT s.produit_id) as nombre_produits
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id, m.nom
      ORDER BY m.nom
    `);
    
    console.log('Stock total global:', stockTotalResult[0].stock_total_global);
    console.log('Nombre de magasins:', stockParMagasinResult.length);
    
    res.json({
      success: true,
      stock_total_global: parseFloat(stockTotalResult[0].stock_total_global || 0),
      stock_par_magasin: stockParMagasinResult.map(row => ({
        magasin_id: row.magasin_id,
        magasin_nom: row.magasin_nom,
        stock_magasin: parseFloat(row.stock_magasin || 0),
        nombre_produits: parseInt(row.nombre_produits || 0)
      }))
    });
    
  } catch (error) {
    console.error('Erreur récupération stock total:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du stock' 
    });
  }
};

// Dispatcher vers un magasin
exports.dispatcherVersMagasin = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const {
      navire_id,
      cargaison_id,
      magasin_id,
      quantite,
      numero_camion,
      transporteur,
      chauffeur_nom,
      observations
    } = req.body;
    
    const dispatch_par = req.user.id;
    
    // Vérifier que la cargaison existe et appartient au navire
    const [cargaisonRows] = await connection.query(`
      SELECT nc.*, p.nom as produit_nom, n.statut as navire_statut
      FROM navire_cargaison nc
      JOIN produits p ON nc.produit_id = p.id
      JOIN navires n ON nc.navire_id = n.id
      WHERE nc.id = ? AND nc.navire_id = ?
    `, [cargaison_id, navire_id]);
    
    if (cargaisonRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Cargaison non trouvée' 
      });
    }
    
    const cargaison = cargaisonRows[0];
    
    // Vérifier que le navire est dans un statut permettant le dispatch
    if (cargaison.navire_statut !== 'receptionne') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: 'Le navire doit être réceptionné avant de pouvoir dispatcher' 
      });
    }
    
    // Vérifier que la quantité ne dépasse pas la quantité disponible
    const [dispatchesExistants] = await connection.query(`
      SELECT COALESCE(SUM(quantite), 0) as total_dispatche
      FROM navire_dispatching
      WHERE cargaison_id = ?
    `, [cargaison_id]);
    
    const quantiteDisponible = cargaison.quantite_recue - dispatchesExistants[0].total_dispatche;
    
    if (quantite > quantiteDisponible) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: `Quantité demandée (${quantite}) dépasse la quantité disponible (${quantiteDisponible})` 
      });
    }
    
    // Créer le dispatch
    const [result] = await connection.query(`
      INSERT INTO navire_dispatching (
        navire_id, cargaison_id, magasin_id, quantite,
        numero_camion, transporteur, chauffeur_nom,
        date_dispatching, dispatch_par, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `, [
      navire_id, cargaison_id, magasin_id, quantite,
      numero_camion, transporteur, chauffeur_nom,
      dispatch_par, observations
    ]);
    
    // Créer le mouvement de type 'dispatch' pour la traçabilité
    await connection.query(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id,
        quantite, reference_document, navire_id,
        date_mouvement, description, created_by
      ) VALUES (
        'dispatch', ?, ?, ?, ?, ?, NOW(), ?, ?
      )
    `, [
      cargaison.produit_id,
      magasin_id,
      quantite,
      `DISP-NAV-${navire_id}-${result.insertId}`,
      navire_id,
      `Dispatch depuis navire ${cargaison.produit_nom} - ${transporteur} - ${numero_camion}`,
      dispatch_par
    ]);
    
    // Vérifier si toute la cargaison a été dispatchée
    const nouvelleQuantiteDispatchee = dispatchesExistants[0].total_dispatche + quantite;
    if (nouvelleQuantiteDispatchee >= cargaison.quantite_recue) {
      // Mettre à jour le statut du navire si toutes les cargaisons sont dispatchées
      const [autresCargaisons] = await connection.query(`
        SELECT COUNT(*) as count
        FROM navire_cargaison nc
        WHERE nc.navire_id = ?
        AND nc.id != ?
        AND nc.quantite_recue > (
          SELECT COALESCE(SUM(nd.quantite), 0)
          FROM navire_dispatching nd
          WHERE nd.cargaison_id = nc.id
        )
      `, [navire_id, cargaison_id]);
      
      if (autresCargaisons[0].count === 0) {
        // Toutes les cargaisons sont dispatchées
        await connection.query(
          'UPDATE navires SET statut = ? WHERE id = ?',
          ['dispatche', navire_id]
        );
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'Dispatch vers magasin effectué avec succès',
      data: {
        dispatch_id: result.insertId,
        quantite_dispatchee: quantite,
        quantite_restante: quantiteDisponible - quantite
      }
    });
    
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Erreur dispatch vers magasin:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du dispatch vers magasin' 
    });
  }
};

// Dispatcher vers un client
exports.dispatcherVersClient = async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const {
      navire_id,
      cargaison_id,
      client_id,
      quantite,
      numero_camion,
      transporteur,
      chauffeur_nom,
      destination,
      observations
    } = req.body;
    
    const dispatch_par = req.user.id;
    
    // Vérifier que la cargaison existe et appartient au navire
    const [cargaisonRows] = await connection.query(`
      SELECT nc.*, p.nom as produit_nom, n.statut as navire_statut
      FROM navire_cargaison nc
      JOIN produits p ON nc.produit_id = p.id
      JOIN navires n ON nc.navire_id = n.id
      WHERE nc.id = ? AND nc.navire_id = ?
    `, [cargaison_id, navire_id]);
    
    if (cargaisonRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ 
        success: false,
        error: 'Cargaison non trouvée' 
      });
    }
    
    const cargaison = cargaisonRows[0];
    
    // Vérifier que le navire est dans un statut permettant le dispatch
    if (cargaison.navire_statut !== 'receptionne') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: 'Le navire doit être réceptionné avant de pouvoir dispatcher' 
      });
    }
    
    // Vérifier que la quantité ne dépasse pas la quantité disponible
    const [dispatchesExistants] = await connection.query(`
      SELECT COALESCE(SUM(quantite), 0) as total_dispatche
      FROM navire_dispatching
      WHERE cargaison_id = ?
    `, [cargaison_id]);
    
    const quantiteDisponible = cargaison.quantite_recue - dispatchesExistants[0].total_dispatche;
    
    if (quantite > quantiteDisponible) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        success: false,
        error: `Quantité demandée (${quantite}) dépasse la quantité disponible (${quantiteDisponible})` 
      });
    }
    
    // Créer le dispatch vers client
    const [result] = await connection.query(`
      INSERT INTO navire_dispatching (
        navire_id, cargaison_id, client_id, quantite,
        numero_camion, transporteur, chauffeur_nom,
        destination, date_dispatching, dispatch_par, 
        observations, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'livre')
    `, [
      navire_id, cargaison_id, client_id, quantite,
      numero_camion, transporteur, chauffeur_nom,
      destination, dispatch_par, observations
    ]);
    
    // Créer une livraison directe
    await connection.query(`
      INSERT INTO livraisons (
        client_id, produit_id, quantite,
        numero_camion, transporteur, chauffeur_nom,
        destination, date_livraison, reference_document,
        navire_id, statut, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 'livree', ?)
    `, [
      client_id, cargaison.produit_id, quantite,
      numero_camion, transporteur, chauffeur_nom,
      destination, `DISP-CLIENT-${result.insertId}`,
      navire_id, dispatch_par
    ]);
    
    // Vérifier si toute la cargaison a été dispatchée
    const nouvelleQuantiteDispatchee = dispatchesExistants[0].total_dispatche + quantite;
    if (nouvelleQuantiteDispatchee >= cargaison.quantite_recue) {
      // Mettre à jour le statut du navire si toutes les cargaisons sont dispatchées
      const [autresCargaisons] = await connection.query(`
        SELECT COUNT(*) as count
        FROM navire_cargaison nc
        WHERE nc.navire_id = ?
        AND nc.id != ?
        AND nc.quantite_recue > (
          SELECT COALESCE(SUM(nd.quantite), 0)
          FROM navire_dispatching nd
          WHERE nd.cargaison_id = nc.id
        )
      `, [navire_id, cargaison_id]);
      
      if (autresCargaisons[0].count === 0) {
        // Toutes les cargaisons sont dispatchées
        await connection.query(
          'UPDATE navires SET statut = ? WHERE id = ?',
          ['dispatche', navire_id]
        );
      }
    }
    
    await connection.commit();
    connection.release();
    
    res.json({
      success: true,
      message: 'Dispatch vers client effectué avec succès',
      data: {
        dispatch_id: result.insertId,
        quantite_dispatchee: quantite,
        quantite_restante: quantiteDisponible - quantite
      }
    });
    
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Erreur dispatch vers client:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du dispatch vers client' 
    });
  }
};

// Récupérer l'historique d'un navire spécifique
exports.getHistoriqueNavire = async (req, res) => {
  try {
    const { navire_id } = req.params;
    
    // Récupérer les informations du navire
    const [navireInfo] = await pool.query(`
      SELECT 
        n.*,
        COUNT(DISTINCT nc.id) as nombre_cargaisons,
        SUM(nc.quantite_recue) as tonnage_total
      FROM navires n
      LEFT JOIN navire_cargaison nc ON n.id = nc.navire_id
      WHERE n.id = ?
      GROUP BY n.id
    `, [navire_id]);
    
    if (navireInfo.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Navire non trouvé' 
      });
    }
    
    // Récupérer l'historique des dispatches
    const [dispatches] = await pool.query(`
      SELECT 
        nd.*,
        nc.produit_id,
        p.nom as produit_nom,
        m.nom as magasin_nom,
        c.nom as client_nom,
        u.nom as dispatch_par_nom,
        u.prenom as dispatch_par_prenom
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN magasins m ON nd.magasin_id = m.id
      LEFT JOIN clients c ON nd.client_id = c.id
      LEFT JOIN utilisateurs u ON nd.dispatch_par = u.id
      WHERE nd.navire_id = ?
      ORDER BY nd.date_dispatching DESC
    `, [navire_id]);
    
    res.json({
      success: true,
      data: {
        navire: navireInfo[0],
        dispatches
      }
    });
    
  } catch (error) {
    console.error('Erreur historique navire:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
};

// Récupérer le stock détaillé par produit et par magasin
exports.getStockDetailleParProduit = async (req, res) => {
  try {
    console.log('=== STOCK DETAILLE PAR PRODUIT ===');
    const { magasin_id } = req.query;
    
    let query = `
      SELECT 
        s.produit_id,
        s.magasin_id,
        s.quantite_disponible as stock_actuel,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.categorie,
        p.unite,
        m.nom as magasin_nom
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY m.nom, p.nom`;
    
    const [stocks] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur récupération stock détaillé:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du stock détaillé' 
    });
  }
};

// Récupérer les mouvements (entrées, sorties et dispatches) par magasin
exports.getMouvementsMagasins = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('=== MOUVEMENTS MAGASINS ===');
    const { date_debut, date_fin } = req.query;
    console.log('Période:', date_debut, 'au', date_fin);
    
    // Récupérer tous les mouvements groupés par magasin et type
    const queryMouvements = `
      SELECT 
        magasin_id,
        magasin_nom,
        type_mouvement,
        SUM(nombre_mouvements) as nombre_mouvements,
        SUM(total_quantite) as total_quantite,
        MAX(derniere_date) as derniere_date
      FROM (
        -- Entrées réelles
        SELECT 
          ms.magasin_destination_id as magasin_id,
          m.nom as magasin_nom,
          'entree' as type_mouvement,
          COUNT(ms.id) as nombre_mouvements,
          SUM(ms.quantite) as total_quantite,
          MAX(ms.date_mouvement) as derniere_date
        FROM mouvements_stock ms
        JOIN magasins m ON ms.magasin_destination_id = m.id
        WHERE ms.type_mouvement = 'entree'
        AND ms.date_mouvement BETWEEN ? AND ?
        GROUP BY ms.magasin_destination_id, m.nom
        
        UNION ALL
        
        -- Dispatches
        SELECT 
          ms.magasin_destination_id as magasin_id,
          m.nom as magasin_nom,
          'dispatch' as type_mouvement,
          COUNT(ms.id) as nombre_mouvements,
          SUM(ms.quantite) as total_quantite,
          MAX(ms.date_mouvement) as derniere_date
        FROM mouvements_stock ms
        JOIN magasins m ON ms.magasin_destination_id = m.id
        WHERE ms.type_mouvement = 'dispatch'
        AND ms.date_mouvement BETWEEN ? AND ?
        GROUP BY ms.magasin_destination_id, m.nom
        
        UNION ALL
        
        -- Sorties depuis mouvements_stock
        SELECT 
          ms.magasin_source_id as magasin_id,
          m.nom as magasin_nom,
          'sortie' as type_mouvement,
          COUNT(ms.id) as nombre_mouvements,
          SUM(ms.quantite) as total_quantite,
          MAX(ms.date_mouvement) as derniere_date
        FROM mouvements_stock ms
        JOIN magasins m ON ms.magasin_source_id = m.id
        WHERE ms.type_mouvement = 'sortie'
        AND ms.date_mouvement BETWEEN ? AND ?
        GROUP BY ms.magasin_source_id, m.nom
        
        UNION ALL
        
        -- Livraisons (aussi des sorties)
        SELECT 
          l.magasin_id,
          m.nom as magasin_nom,
          'livraison' as type_mouvement,
          COUNT(l.id) as nombre_mouvements,
          SUM(l.quantite) as total_quantite,
          MAX(l.date_livraison) as derniere_date
        FROM livraisons l
        JOIN magasins m ON l.magasin_id = m.id
        WHERE l.date_livraison BETWEEN ? AND ?
        AND l.statut IN ('livree', 'confirmee')
        GROUP BY l.magasin_id, m.nom
      ) as all_mouvements
      GROUP BY magasin_id, magasin_nom, type_mouvement
      ORDER BY magasin_nom, type_mouvement
    `;
    
    const [mouvementsResult] = await connection.execute(queryMouvements, [
      date_debut, date_fin,  // pour entrées
      date_debut, date_fin,  // pour dispatches
      date_debut, date_fin,  // pour sorties
      date_debut, date_fin   // pour livraisons
    ]);
    
    // Restructurer les données par magasin
    const mouvementsParMagasin = {};
    
    mouvementsResult.forEach(mouvement => {
      const key = mouvement.magasin_id;
      
      if (!mouvementsParMagasin[key]) {
        mouvementsParMagasin[key] = {
          magasin_id: mouvement.magasin_id,
          magasin_nom: mouvement.magasin_nom,
          total_entrees: 0,
          nombre_entrees: 0,
          derniere_entree: null,
          total_dispatches: 0,
          nombre_dispatches: 0,
          derniere_dispatch: null,
          total_sorties: 0,
          nombre_sorties: 0,
          derniere_sortie: null,
          total_livraisons: 0,
          nombre_livraisons: 0,
          derniere_livraison: null
        };
      }
      
      const magasinData = mouvementsParMagasin[key];
      
      switch(mouvement.type_mouvement) {
        case 'entree':
          magasinData.total_entrees = parseFloat(mouvement.total_quantite || 0);
          magasinData.nombre_entrees = mouvement.nombre_mouvements || 0;
          magasinData.derniere_entree = mouvement.derniere_date;
          break;
        case 'dispatch':
          magasinData.total_dispatches = parseFloat(mouvement.total_quantite || 0);
          magasinData.nombre_dispatches = mouvement.nombre_mouvements || 0;
          magasinData.derniere_dispatch = mouvement.derniere_date;
          break;
        case 'sortie':
          magasinData.total_sorties = parseFloat(mouvement.total_quantite || 0);
          magasinData.nombre_sorties = mouvement.nombre_mouvements || 0;
          magasinData.derniere_sortie = mouvement.derniere_date;
          break;
        case 'livraison':
          magasinData.total_livraisons = parseFloat(mouvement.total_quantite || 0);
          magasinData.nombre_livraisons = mouvement.nombre_mouvements || 0;
          magasinData.derniere_livraison = mouvement.derniere_date;
          break;
      }
    });
    
    // Convertir en tableau
    const mouvements = Object.values(mouvementsParMagasin);
    
    res.json({
      success: true,
      mouvements: mouvements,
      periode: { date_debut, date_fin }
    });
    
  } catch (error) {
    console.error('Erreur récupération mouvements:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des mouvements' 
    });
  } finally {
    connection.release();
  }
};