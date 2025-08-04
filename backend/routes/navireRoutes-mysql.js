const express = require('express');
const router = express.Router();
const pool = require('../config/db-mysql');
const authenticate = require('../middleware/auth-mysql');
const checkRole = require('../middleware/checkRole-mysql');

// Helper function to convert undefined to null for SQL parameters
const sanitizeParam = (value) => value === undefined ? null : value;

// GET all navires
router.get('/', authenticate, async (req, res) => {
  try {
    const { statut } = req.query;
    let query = 'SELECT * FROM navires';
    const params = [];
    
    if (statut) {
      query += ' WHERE statut = ?';
      params.push(statut);
    }
    
    query += ' ORDER BY date_arrivee_prevue DESC';
    
    const [navires] = await pool.execute(query, params);
    
    // Pour chaque navire, récupérer ses cargaisons
    for (let navire of navires) {
      const [cargaisons] = await pool.execute(`
        SELECT 
          nc.*,
          p.nom as produit_nom
        FROM navire_cargaison nc
        LEFT JOIN produits p ON nc.produit_id = p.id
        WHERE nc.navire_id = ?
      `, [navire.id]);
      
      navire.cargaison = cargaisons;
    }
    
    res.json(navires);
  } catch (error) {
    console.error('Erreur récupération navires:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET suivi-tonnage - Mouvements d'entrée et dispatching par date
router.get('/suivi-tonnage', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];
    console.log('Endpoint suivi-tonnage - Date reçue:', date, '- Date utilisée:', selectedDate);
    
    // 1. Récupérer tous les mouvements d'entrée pour cette date
    const [mouvements] = await pool.execute(`
      SELECT 
        ms.id,
        ms.date_mouvement,
        ms.navire_id,
        n.nom_navire,
        n.numero_imo,
        ms.magasin_destination_id as magasin_id,
        m.nom as magasin_nom,
        ms.produit_id,
        p.nom as produit_nom,
        ms.quantite,
        u.nom as responsable_nom,
        u.prenom as responsable_prenom
      FROM mouvements_stock ms
      LEFT JOIN navires n ON ms.navire_id = n.id
      LEFT JOIN magasins m ON ms.magasin_destination_id = m.id
      LEFT JOIN produits p ON ms.produit_id = p.id
      LEFT JOIN utilisateurs u ON ms.created_by = u.id
      WHERE ms.type_mouvement = 'entree'
      AND DATE(ms.date_mouvement) = ?
      ORDER BY ms.date_mouvement DESC
    `, [selectedDate]);
    
    // 2. Grouper par navire (ou par source si pas de navire)
    const naviresMap = new Map();
    const mouvementsSansNavire = [];
    
    mouvements.forEach(mouvement => {
      if (mouvement.navire_id) {
        // Si le mouvement a un navire associé
        if (!naviresMap.has(mouvement.navire_id)) {
          naviresMap.set(mouvement.navire_id, {
            id: mouvement.navire_id,
            nom_navire: mouvement.nom_navire,
            numero_imo: mouvement.numero_imo,
            date_arrivee: null,
            created_at: null,
            date_reception: mouvement.date_mouvement,
            tonnage_total: 0,
            receptions: [],
            dispatching: []
          });
        }
        
        const navire = naviresMap.get(mouvement.navire_id);
        navire.tonnage_total += parseFloat(mouvement.quantite);
        navire.receptions.push(mouvement);
      } else {
        // Si pas de navire, on crée une entrée fictive
        mouvementsSansNavire.push(mouvement);
      }
    });
    
    // 3. Pour les mouvements sans navire, créer une entrée "Réceptions directes"
    if (mouvementsSansNavire.length > 0) {
      const totalSansNavire = mouvementsSansNavire.reduce((sum, m) => sum + parseFloat(m.quantite), 0);
      naviresMap.set('direct', {
        id: 'direct',
        nom_navire: 'Réceptions directes',
        numero_imo: 'N/A',
        date_arrivee: selectedDate,
        created_at: new Date(),
        date_reception: mouvementsSansNavire[0].date_mouvement,
        tonnage_total: totalSansNavire,
        receptions: mouvementsSansNavire,
        dispatching: []
      });
    }
    
    // 4. Pour chaque navire réel, récupérer les dispatching
    for (const [navireId, navireData] of naviresMap) {
      if (navireId !== 'direct' && navireId) {
        const [dispatching] = await pool.execute(`
          SELECT 
            nd.id,
            nd.quantite as tonnage,
            nd.numero_camion,
            nd.transporteur,
            nd.heure_depart,
            nd.statut,
            CASE 
              WHEN nd.client_id IS NOT NULL THEN c.nom
              WHEN nd.magasin_id IS NOT NULL THEN m.nom
              ELSE nd.destination
            END as destination,
            c.nom as client_nom
          FROM navire_dispatching nd
          LEFT JOIN clients c ON nd.client_id = c.id
          LEFT JOIN magasins m ON nd.magasin_id = m.id
          WHERE nd.navire_id = ?
          AND DATE(nd.date_dispatching) = ?
          ORDER BY nd.date_dispatching DESC
        `, [navireId, selectedDate]);
        
        navireData.dispatching = dispatching;
      }
    }
    
    const result = Array.from(naviresMap.values());
    
    console.log('Endpoint suivi-tonnage - Résultat:', result.length, 'navires/groupes');
    res.json({
      success: true,
      data: result,
      date: selectedDate
    });
  } catch (error) {
    console.error('Erreur suivi-tonnage:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// GET navire by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [results] = await pool.execute('SELECT * FROM navires WHERE id = ?', [req.params.id]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Navire non trouvé' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST create navire
router.post('/', authenticate, checkRole(['admin', 'manager']), async (req, res) => {
  try {
    const { 
      nom_navire, numero_imo, pavillon, port_chargement, 
      port_dechargement, date_arrivee_prevue, numero_connaissement, 
      agent_maritime 
    } = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO navires (nom_navire, numero_imo, pavillon, port_chargement, 
        port_dechargement, date_arrivee_prevue, numero_connaissement, agent_maritime, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom_navire, numero_imo, pavillon, port_chargement, port_dechargement, 
       date_arrivee_prevue, numero_connaissement, agent_maritime, req.user.id]
    );
    
    res.status(201).json({ 
      message: 'Navire créé avec succès', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erreur création navire:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Debug route
router.post('/reception-debug', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint reached',
    user: req.user,
    body: req.body
  });
});

// POST reception navire (créer nouveau navire ou recevoir existant)
router.post('/reception', authenticate, checkRole(['admin', 'manager', 'operator']), async (req, res) => {
  let connection;
  try {
    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({ 
        message: 'Corps de requête manquant' 
      });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    console.log('Réception navire - données reçues:', JSON.stringify(req.body));
    console.log('User:', JSON.stringify(req.user));
    
    const { 
      navireId, 
      nomNavire, numeroIMO, dateArrivee, port, 
      numeroConnaissement, agentMaritime,
      cargaison, cargaisons,
      documentsVerifies, qualiteVerifiee, quantiteConfirmee,
      observations 
    } = req.body;
    
    let actualNavireId = navireId;
    
    // Si pas de navireId, c'est une nouvelle création
    if (!navireId && nomNavire) {
      // Obtenir l'ID de l'utilisateur
      const userId = req.user.id || req.user.userId || req.userId;
      if (!userId) {
        throw new Error('User ID non trouvé');
      }
      
      // Créer le nouveau navire
      const params = [
        sanitizeParam(nomNavire),
        sanitizeParam(numeroIMO),
        sanitizeParam(dateArrivee),
        sanitizeParam(port) || 'Dakar',
        sanitizeParam(numeroConnaissement),
        sanitizeParam(agentMaritime),
        sanitizeParam(userId)
      ];
      
      console.log('Paramètres pour INSERT navire:', params);
      console.log('Types des paramètres:', params.map(p => typeof p));
      
      const [navireResult] = await connection.execute(
        `INSERT INTO navires (nom_navire, numero_imo, date_arrivee_prevue, date_arrivee_reelle, 
          port_chargement, numero_connaissement, agent_maritime, statut, created_by) 
         VALUES (?, ?, ?, NOW(), ?, ?, ?, 'receptionne', ?)`,
        params
      );
      actualNavireId = navireResult.insertId;
      console.log('Navire créé avec ID:', actualNavireId);
    } else {
      // Mettre à jour le navire existant
      await connection.execute(
        'UPDATE navires SET statut = ?, date_arrivee_reelle = NOW() WHERE id = ?',
        ['receptionne', actualNavireId]
      );
    }
    
    // Gérer les cargaisons (peut venir de 'cargaison' ou 'cargaisons')
    const cargaisonData = cargaison || cargaisons || [];
    
    // S'assurer que cargaisonData est un tableau
    const cargaisonArray = Array.isArray(cargaisonData) ? cargaisonData : [];
    
    // Créer les cargaisons
    console.log(`Traitement de ${cargaisonArray.length} cargaisons...`);
    for (const cargo of cargaisonArray) {
      console.log('Traitement cargo:', cargo);
      
      // Rechercher le produit par nom si pas d'ID
      let produitId = cargo.produit_id;
      if (!produitId && cargo.produit) {
        const [produits] = await connection.execute(
          'SELECT id FROM produits WHERE nom = ? OR reference = ? LIMIT 1',
          [cargo.produit, cargo.produit]
        );
        if (produits.length > 0) {
          produitId = produits[0].id;
        } else {
          // Créer le produit s'il n'existe pas
          const userId = req.user.id || req.user.userId || req.userId;
          const [produitResult] = await connection.execute(
            'INSERT INTO produits (reference, nom, unite, actif, created_by) VALUES (?, ?, ?, ?, ?)',
            [`PROD-${Date.now()}`, sanitizeParam(cargo.produit), sanitizeParam(cargo.unite) || 'tonnes', 1, sanitizeParam(userId)]
          );
          produitId = produitResult.insertId;
        }
      }
      
      if (!produitId) {
        console.error('Erreur: produitId est undefined pour cargo:', cargo);
        throw new Error(`Produit non trouvé pour: ${cargo.produit}`);
      }
      
      const cargaisonParams = [
        sanitizeParam(actualNavireId),
        sanitizeParam(produitId),
        sanitizeParam(cargo.quantite) || 0,
        sanitizeParam(cargo.unite) || 'tonnes',
        sanitizeParam(cargo.origine) || 'Import'
      ];
      
      console.log('Paramètres pour INSERT cargaison:', cargaisonParams);
      
      const [result] = await connection.execute(
        `INSERT INTO navire_cargaison (navire_id, produit_id, quantite_declaree, unite, origine) 
         VALUES (?, ?, ?, ?, ?)`,
        cargaisonParams
      );
      
      // Créer un mouvement de stock de type reception
      // Trouver le magasin plateforme par défaut
      const [magasins] = await connection.execute(
        'SELECT id FROM magasins WHERE nom LIKE ? LIMIT 1',
        ['%Plateforme%']
      );
      const magasinId = magasins.length > 0 ? magasins[0].id : 1;
      
      const userId = req.user.id || req.user.userId || req.userId;
      const mouvementParams = [
        'reception',
        sanitizeParam(produitId),
        sanitizeParam(magasinId),
        sanitizeParam(cargo.quantite) || 0,
        `NAV-${actualNavireId}`,
        sanitizeParam(actualNavireId),
        sanitizeParam(userId)
      ];
      
      console.log('Paramètres pour INSERT mouvement:', mouvementParams);
      console.log('Types des paramètres mouvement:', mouvementParams.map(p => typeof p));
      
      await connection.execute(
        `INSERT INTO mouvements_stock (type_mouvement, produit_id, magasin_destination_id, 
          quantite, reference_document, navire_id, created_by, date_mouvement) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        mouvementParams
      );
    }
    
    await connection.commit();
    res.json({ 
      success: true,
      message: 'Réception enregistrée avec succès',
      navireId: actualNavireId
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Erreur lors du rollback:', rollbackError);
      }
    }
    console.error('Erreur réception navire:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      debug: process.env.NODE_ENV === 'development' ? {
        body: req.body,
        user: req.user
      } : undefined
    });
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Erreur lors de la libération de connexion:', releaseError);
      }
    }
  }
});

// GET dispatches en attente
router.get('/dispatches/en-attente', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        nd.id,
        nd.navire_id,
        n.nom_navire,
        nd.quantite,
        nd.date_dispatching,
        nd.statut,
        p.nom AS produit_nom,
        c.nom AS client_nom,
        m.nom AS magasin_nom
      FROM navire_dispatching nd
      JOIN navires n ON nd.navire_id = n.id
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN clients c ON nd.client_id = c.id
      JOIN magasins m ON nd.magasin_id = m.id
      WHERE nd.statut IN ('planifie', 'en_cours')
      ORDER BY nd.date_dispatching DESC
    `;
    
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Erreur récupération dispatches:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET dispatches récents pour un magasin
router.get('/dispatches/recents', authenticate, async (req, res) => {
  try {
    const { magasin_id, limit = 5 } = req.query;
    
    const query = `
      SELECT 
        nd.id,
        nd.date_dispatching,
        nd.quantite,
        n.nom_navire,
        p.nom as produit_nom,
        c.nom as client_nom
      FROM navire_dispatching nd
      JOIN navires n ON nd.navire_id = n.id
      JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
      JOIN produits p ON nc.produit_id = p.id
      LEFT JOIN clients c ON nd.client_id = c.id
      WHERE nd.magasin_id = ? AND nd.statut = 'complete'
      ORDER BY nd.date_dispatching DESC
      LIMIT ?
    `;
    
    const [results] = await pool.execute(query, [magasin_id, parseInt(limit)]);
    res.json(results);
  } catch (error) {
    console.error('Erreur récupération dispatches récents:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET rotations en transit pour un magasin
router.get('/rotations/en-transit', authenticate, async (req, res) => {
  try {
    const { magasin_id } = req.query;
    
    // Pour l'instant, retourner un tableau vide car les rotations ne sont pas implémentées
    res.json([]);
  } catch (error) {
    console.error('Erreur récupération rotations:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
