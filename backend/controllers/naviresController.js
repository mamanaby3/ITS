const db = require('../config/database-mysql');
const { validationResult } = require('express-validator');

// Récupérer tous les navires
exports.getAllNavires = async (req, res) => {
  try {
    const { magasin_id, produit_id, client_id } = req.query;
    let query = `
      SELECT DISTINCT
        n.*,
        u.nom as reception_nom,
        u.prenom as reception_prenom,
        n.date_reception
      FROM navires n
      LEFT JOIN utilisateurs u ON n.reception_par = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Construction des conditions de filtrage
    if (magasin_id || produit_id || client_id) {
      query += `
        WHERE EXISTS (
          SELECT 1 FROM navire_dispatching nd
          JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
          WHERE nd.navire_id = n.id
      `;
      
      if (magasin_id) {
        query += ` AND nd.magasin_id = ?`;
        params.push(magasin_id);
      }
      
      if (produit_id) {
        query += ` AND nc.produit_id = ?`;
        params.push(produit_id);
      }
      
      if (client_id) {
        query += ` AND nd.client_id = ?`;
        params.push(client_id);
      }
      
      query += `)`;
    } else if (req.user.role === 'operator' && req.user.magasin_id) {
      // Pour les opérateurs, filtrer par leur magasin
      query += `
        WHERE EXISTS (
          SELECT 1 FROM navire_dispatching nd
          WHERE nd.navire_id = n.id 
          AND nd.magasin_id = ?
        )
      `;
      params.push(req.user.magasin_id);
    }
    
    query += ` ORDER BY n.date_arrivee DESC`;
    
    const [navires] = await db.execute(query, params);
    
    console.log(`[DEBUG] getAllNavires - Found ${navires.length} navires`);
    console.log(`[DEBUG] navire IDs:`, navires.map(n => ({ id: n.id, nom: n.nom_navire, date_reception: n.date_reception })));

    // Pour chaque navire, récupérer sa cargaison
    for (let navire of navires) {
      const [cargaison] = await db.execute(`
        SELECT 
          nc.*,
          p.nom as produit_nom,
          p.reference as produit_reference
        FROM navire_cargaison nc
        JOIN produits p ON nc.produit_id = p.id
        WHERE nc.navire_id = ?
      `, [navire.id]);

      navire.cargaison = cargaison;

      // Si le navire est dispatché, récupérer le dispatching filtré
      if (navire.statut === 'dispatche') {
        let dispatchQuery = `
          SELECT 
            nd.*,
            m.nom as magasin_nom,
            nc.produit_id,
            p.nom as produit_nom,
            c.nom as client_nom
          FROM navire_dispatching nd
          LEFT JOIN magasins m ON nd.magasin_id = m.id
          LEFT JOIN clients c ON nd.client_id = c.id
          JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
          JOIN produits p ON nc.produit_id = p.id
          WHERE nd.navire_id = ?
        `;
        
        const dispatchParams = [navire.id];
        
        if (magasin_id || (req.user.role === 'operator' && req.user.magasin_id)) {
          dispatchQuery += ` AND nd.magasin_id = ?`;
          dispatchParams.push(magasin_id || req.user.magasin_id);
        }
        
        if (produit_id) {
          dispatchQuery += ` AND nc.produit_id = ?`;
          dispatchParams.push(produit_id);
        }
        
        if (client_id) {
          dispatchQuery += ` AND nd.client_id = ?`;
          dispatchParams.push(client_id);
        }
        
        const [dispatching] = await db.execute(dispatchQuery, dispatchParams);
        navire.dispatching = dispatching;
      }
    }

    res.json({
      success: true,
      data: navires
    });

  } catch (error) {
    console.error('Erreur récupération navires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des navires'
    });
  }
};

// Créer une nouvelle réception de navire
exports.createReception = async (req, res) => {
  console.log('=====================================');
  console.log('📥 NOUVELLE RÉCEPTION NAVIRE');
  console.log('=====================================');
  console.log('⏰ Date/Heure:', new Date().toISOString());
  console.log('👤 Utilisateur ID:', req.userId);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body complet:', JSON.stringify(req.body, null, 2));
  console.log('=====================================\n');
  
  let connection;
  try {
    connection = await db.beginTransaction();
    console.log('✅ Transaction démarrée');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation:', errors.array());
      await connection.rollback();
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      nomNavire,
      numeroIMO,
      pavillon,
      portChargement,
      portDechargement,
      dateArriveePrevue,
      dateArriveeReelle,
      dateArrivee,
      port,
      numeroConnaissement,
      agentMaritime,
      cargaison,
      documentsVerifies,
      qualiteVerifiee,
      quantiteConfirmee,
      observations
    } = req.body;

    console.log('📝 Données extraites:');
    console.log('  - Navire:', nomNavire);
    console.log('  - IMO:', numeroIMO);
    console.log('  - Date arrivée:', dateArrivee);
    console.log('  - Port:', port);
    console.log('  - Cargaison:', cargaison);
    console.log('  - Vérifications:', { documentsVerifies, qualiteVerifiee, quantiteConfirmee });

    // Vérifier les validations obligatoires
    if (!documentsVerifies || !qualiteVerifiee || !quantiteConfirmee) {
      console.error('❌ Vérifications manquantes');
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Toutes les vérifications doivent être confirmées'
      });
    }

    // Insérer le navire
    console.log('📝 Insertion du navire...');
    const [navireResult] = await connection.execute(`
      INSERT INTO navires (
        nom_navire, numero_imo, pavillon, port_chargement, port_dechargement,
        date_arrivee_prevue, date_arrivee_reelle, date_arrivee, port,
        numero_connaissement, agent_maritime, statut,
        date_reception, reception_par, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'receptionne', NOW(), ?, ?)
    `, [
      nomNavire, numeroIMO, pavillon || null, portChargement || null, 
      portDechargement || 'Dakar', dateArriveePrevue || dateArrivee, 
      dateArriveeReelle || dateArrivee, dateArrivee, port,
      numeroConnaissement, agentMaritime, req.userId, observations
    ]);

    const navireId = navireResult.insertId;
    console.log('✅ Navire inséré avec ID:', navireId);

    // Insérer la cargaison
    console.log('📦 Insertion de la cargaison...');
    for (let i = 0; i < cargaison.length; i++) {
      const cargo = cargaison[i];
      console.log(`  - Cargo ${i + 1}:`, cargo);
      
      // Vérifier si le produit existe ou le créer
      let produitId;
      const [existingProduit] = await connection.execute(
        'SELECT id FROM produits WHERE nom = ?',
        [cargo.produit]
      );

      if (existingProduit.length > 0) {
        produitId = existingProduit[0].id;
        console.log(`    ✓ Produit existant trouvé, ID: ${produitId}`);
      } else {
        // Créer le produit s'il n'existe pas
        const reference = `PROD-${Date.now()}-${i}`;
        console.log(`    ✓ Création nouveau produit: ${cargo.produit}, ref: ${reference}`);
        const [produitResult] = await connection.execute(`
          INSERT INTO produits (reference, nom, categorie, unite, prix_tonne)
          VALUES (?, ?, 'autres', ?, 0)
        `, [
          reference,
          cargo.produit,
          cargo.unite || 'tonnes'
        ]);
        produitId = produitResult.insertId;
        console.log(`    ✓ Produit créé avec ID: ${produitId}`);
      }

      // Insérer la cargaison
      console.log(`    ✓ Insertion cargaison: navire=${navireId}, produit=${produitId}, qté=${cargo.quantite}`);
      await connection.execute(`
        INSERT INTO navire_cargaison (navire_id, produit_id, quantite, quantite_declaree, quantite_recue, unite, origine)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        navireId,
        produitId,
        parseFloat(cargo.quantite),
        parseFloat(cargo.quantite),
        parseFloat(cargo.quantite), // Au moment de la réception, quantité reçue = quantité déclarée
        cargo.unite || 'tonnes',
        cargo.origine
      ]);
      console.log(`    ✓ Cargaison insérée avec succès`);
    }

    // Commit de la transaction
    await connection.commit();
    console.log('✅ Transaction commitée avec succès');

    // Récupérer le navire créé avec sa cargaison
    console.log('📋 Récupération des données créées...');
    const [newNavire] = await db.execute(
      'SELECT * FROM navires WHERE id = ?',
      [navireId]
    );

    const [newCargaison] = await db.execute(`
      SELECT nc.*, p.nom as produit_nom
      FROM navire_cargaison nc
      JOIN produits p ON nc.produit_id = p.id
      WHERE nc.navire_id = ?
    `, [navireId]);

    console.log('✅ Données récupérées');
    console.log('=====================================');
    console.log('✅ RÉCEPTION CRÉÉE AVEC SUCCÈS');
    console.log('=====================================\n');

    res.status(201).json({
      success: true,
      data: {
        ...newNavire[0],
        cargaison: newCargaison
      }
    });

  } catch (error) {
    console.error('=====================================');
    console.error('❌ ERREUR LORS DE LA CRÉATION');
    console.error('=====================================');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('=====================================\n');
    
    if (connection) {
      await connection.rollback();
      console.log('⚠️  Transaction annulée (rollback)');
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la réception',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 Connexion MySQL libérée');
    }
  }
};

// Dispatcher la cargaison vers les magasins
exports.dispatchCargaison = async (req, res) => {
  console.log('📦 DISPATCHING NAVIRE');
  console.log('Navire ID:', req.params.navireId);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const connection = await db.beginTransaction();
  
  try {
    const { navireId } = req.params;
    const { distributions } = req.body;

    // Vérifier que le navire existe et est réceptionné
    const [navire] = await connection.execute(
      'SELECT * FROM navires WHERE id = ? AND statut = ?',
      [navireId, 'receptionne']
    );

    if (navire.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Navire non trouvé ou déjà dispatché'
      });
    }

    // Traiter chaque distribution
    for (let dist of distributions) {
      for (let dispatch of dist.dispatches) {
        if (dispatch.quantite > 0) {
          // Enregistrer le dispatching
          await connection.execute(`
            INSERT INTO navire_dispatching (
              navire_id, cargaison_id, magasin_id,
              quantite, created_by
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            navireId,
            dist.cargaisonId,
            dispatch.magasinId,
            dispatch.quantite,
            req.userId
          ]);

          // Utiliser la procédure stockée pour enregistrer dans stock_magasinier
          // Cela met à jour automatiquement stock_magasinier et la table stocks
          await connection.execute(
            'CALL enregistrer_quantite_dispatchee(?, ?, ?, ?)', 
            [
              dispatch.magasinId,
              dist.produitId,
              dispatch.quantite,
              req.userId
            ]
          );
          
          // Créer aussi le mouvement dans mouvements_stock pour la traçabilité
          await connection.execute(`
            INSERT INTO mouvements_stock (
              type_mouvement, produit_id, magasin_destination_id,
              quantite, reference_document, navire_id,
              date_mouvement, created_by
            ) VALUES ('entree', ?, ?, ?, ?, ?, NOW(), ?)
          `, [
            dist.produitId,
            dispatch.magasinId,
            dispatch.quantite,
            `DISP-NAV-${navireId}-${new Date().getTime()}`,
            navireId,
            req.userId
          ]);
        }
      }
    }

    // Mettre à jour le statut du navire
    await connection.execute(
      'UPDATE navires SET statut = ? WHERE id = ?',
      ['dispatche', navireId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Cargaison dispatchée avec succès'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erreur dispatching:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du dispatching'
    });
  } finally {
    connection.release();
  }
};

// Récupérer les navires avec dispatching par date
exports.getNaviresWithDispatchingByDate = async (req, res) => {
  try {
    // Gérer les deux formats de paramètres
    const date = req.query.date || (req.query.params && req.query.params.date);
    
    // Si pas de date fournie, utiliser aujourd'hui
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Récupérer tous les navires arrivés à cette date ou ayant des mouvements
    const [navires] = await db.execute(`
      SELECT DISTINCT
        n.id,
        n.nom_navire,
        n.numero_imo,
        n.date_arrivee,
        n.statut as navire_statut,
        n.port,
        n.pavillon,
        n.created_at,
        n.date_reception
      FROM navires n
      WHERE DATE(n.date_arrivee) = ?
         OR EXISTS (
           SELECT 1 FROM mouvements_stock m 
           WHERE m.navire_id = n.id 
           AND DATE(m.date_mouvement) = ?
         )
      ORDER BY n.date_arrivee DESC
    `, [targetDate, targetDate]);

    // Pour chaque navire, récupérer ses réceptions et dispatching
    for (let navire of navires) {
      // Récupérer la cargaison du navire
      const [cargaison] = await db.execute(`
        SELECT 
          nc.id,
          nc.quantite_recue as quantite,
          p.nom as produit_nom,
          p.reference as produit_reference,
          nc.unite,
          nc.origine
        FROM navire_cargaison nc
        JOIN produits p ON nc.produit_id = p.id
        WHERE nc.navire_id = ?
      `, [navire.id]);

      // Calculer le tonnage total de la cargaison
      navire.tonnage_total = cargaison.reduce((sum, c) => sum + parseFloat(c.quantite || 0), 0);
      
      // Récupérer les réceptions (mouvements d'entrée) si elles existent
      const [receptions] = await db.execute(`
        SELECT 
          m.id,
          m.quantite,
          m.date_mouvement,
          p.nom as produit_nom,
          p.reference as produit_reference,
          mag.nom as magasin_nom,
          mag.id as magasin_id,
          u.nom as responsable_nom,
          u.prenom as responsable_prenom
        FROM mouvements_stock m
        JOIN produits p ON m.produit_id = p.id
        JOIN magasins mag ON m.magasin_destination_id = mag.id
        LEFT JOIN utilisateurs u ON m.created_by = u.id
        WHERE m.navire_id = ? 
        AND m.type_mouvement = 'entree'
        AND DATE(m.date_mouvement) = ?
        ORDER BY m.date_mouvement DESC
      `, [navire.id, targetDate]);

      navire.cargaison = cargaison;
      navire.receptions = receptions;

      // Récupérer le dispatching (livraisons en cours)
      const [dispatching] = await db.execute(`
        SELECT 
          nd.id,
          nd.numero_camion,
          nd.transporteur,
          nd.destination,
          nd.quantite_chargee as tonnage,
          nd.statut,
          nd.heure_depart,
          nd.date_chargement,
          c.nom as client_nom,
          p.nom as produit_nom
        FROM navire_dispatching nd
        LEFT JOIN clients c ON nd.client_id = c.id
        JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
        JOIN produits p ON nc.produit_id = p.id
        WHERE nd.navire_id = ?
        AND DATE(nd.date_chargement) = ?
        AND nd.statut IN ('chargement', 'en_route')
        ORDER BY nd.date_chargement DESC
      `, [navire.id, targetDate]);

      navire.dispatching = dispatching;
    }

    res.json({
      success: true,
      data: navires,
      date: targetDate
    });

  } catch (error) {
    console.error('Erreur récupération navires avec dispatching:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données'
    });
  }
};

// Récupérer les dispatches en attente
exports.getDispatchesEnAttente = async (req, res) => {
  try {
    // Récupérer les dispatches avec statut 'en_attente' ou 'chargement'
    const [dispatches] = await db.execute(`
      SELECT 
        nd.id,
        nd.numero_camion,
        nd.transporteur,
        nd.destination,
        nd.quantite_chargee as tonnage,
        nd.statut,
        nd.date_chargement,
        nd.heure_depart,
        n.nom_navire,
        n.numero_imo,
        c.nom as client_nom,
        p.nom as produit_nom,
        mag.nom as magasin_nom
      FROM navire_dispatching nd
      JOIN navires n ON nd.navire_id = n.id
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN clients c ON nd.client_id = c.id
      LEFT JOIN magasins mag ON nd.magasin_id = mag.id
      WHERE nd.statut IN ('en_attente', 'chargement')
      ORDER BY nd.date_chargement ASC, nd.id ASC
    `);

    res.json({
      success: true,
      data: dispatches
    });

  } catch (error) {
    console.error('Erreur récupération dispatches en attente:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dispatches en attente'
    });
  }
};

// Récupérer les dispatches récents
exports.getDispatchesRecents = async (req, res) => {
  try {
    const { magasin_id, limit = 10 } = req.query;
    
    let query = `
      SELECT 
        nd.id,
        nd.numero_camion,
        nd.transporteur,
        nd.destination,
        nd.quantite_chargee as tonnage,
        nd.statut,
        nd.date_chargement,
        nd.heure_depart,
        n.nom_navire,
        n.numero_imo,
        c.nom as client_nom,
        p.nom as produit_nom,
        mag.nom as magasin_nom
      FROM navire_dispatching nd
      JOIN navires n ON nd.navire_id = n.id
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN clients c ON nd.client_id = c.id
      LEFT JOIN magasins mag ON nd.magasin_id = mag.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ` AND nd.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY nd.date_chargement DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [dispatches] = await db.execute(query, params);

    res.json({
      success: true,
      data: dispatches
    });

  } catch (error) {
    console.error('Erreur récupération dispatches récents:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des dispatches récents'
    });
  }
};

// Récupérer les rotations en transit
exports.getRotationsEnTransit = async (req, res) => {
  try {
    const { magasin_id } = req.query;
    
    let query = `
      SELECT 
        nd.id,
        nd.numero_camion,
        nd.transporteur,
        nd.destination,
        nd.quantite_chargee as tonnage,
        nd.statut,
        nd.date_chargement,
        nd.heure_depart,
        n.nom_navire,
        n.numero_imo,
        c.nom as client_nom,
        p.nom as produit_nom,
        mag.nom as magasin_nom,
        TIMESTAMPDIFF(HOUR, nd.date_chargement, NOW()) as heures_en_route
      FROM navire_dispatching nd
      JOIN navires n ON nd.navire_id = n.id
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN clients c ON nd.client_id = c.id
      LEFT JOIN magasins mag ON nd.magasin_id = mag.id
      WHERE nd.statut = 'en_route'
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ` AND nd.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    query += ` ORDER BY nd.date_chargement ASC`;
    
    const [rotations] = await db.execute(query, params);

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

// Récupérer le stock total par magasin (somme des quantités dispatchées)
exports.getStockTotalParMagasin = async (req, res) => {
  try {
    const { magasin_id } = req.params;
    const { produit_id, client_id } = req.query;
    
    // Récupérer toutes les quantités dispatchées et reçues pour ce magasin
    let query = `
      SELECT 
        p.id as produit_id,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.unite,
        COALESCE(SUM(nd.quantite_chargee), 0) as quantite_dispatchee,
        COALESCE(SUM(nd.quantite_receptionnee), 0) as quantite_receptionnee,
        COUNT(DISTINCT nd.navire_id) as nombre_navires
      FROM navire_dispatching nd
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      WHERE nd.magasin_id = ? 
        AND nd.statut IN ('complete', 'livre')
    `;
    
    const params = [magasin_id];
    
    if (produit_id) {
      query += ` AND p.id = ?`;
      params.push(produit_id);
    }
    
    if (client_id) {
      query += ` AND nd.client_id = ?`;
      params.push(client_id);
    }
    
    query += ` GROUP BY p.id, p.nom, p.reference, p.unite ORDER BY p.nom`;
    
    const [stockData] = await db.execute(query, params);
    
    // Calculer les totaux globaux
    const totaux = stockData.reduce((acc, item) => {
      acc.total_dispatche += parseFloat(item.quantite_dispatchee);
      acc.total_receptionne += parseFloat(item.quantite_receptionnee);
      return acc;
    }, { total_dispatche: 0, total_receptionne: 0 });
    
    res.json({
      success: true,
      data: {
        produits: stockData,
        totaux: totaux,
        magasin_id: magasin_id
      }
    });
    
  } catch (error) {
    console.error('Erreur récupération stock par magasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock par magasin'
    });
  }
};