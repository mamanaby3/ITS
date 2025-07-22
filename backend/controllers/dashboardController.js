const { pool } = require('../config/database-mysql');

// Obtenir les statistiques du dashboard selon le rôle
exports.getDashboardStats = async (req, res) => {
  try {
    const { role, magasin_id } = req.user;
    let stats = {};
    
    // Pour les opérateurs, filtrer par leur magasin
    const magasinFilter = (role === 'operator' && magasin_id) ? magasin_id : req.query.magasin_id;
    
    // 1. Stats générales
    if (magasinFilter) {
      // Stats pour un magasin spécifique
      const [magasinInfo] = await pool.query(
        'SELECT nom, ville FROM magasins WHERE id = ?',
        [magasinFilter]
      );
      stats.magasin = magasinInfo[0];
      
      // Stock total du magasin
      const [stockTotal] = await pool.query(`
        SELECT 
          COUNT(DISTINCT produit_id) as nb_produits,
          SUM(quantite_disponible) as quantite_totale,
          SUM(quantite_reservee) as quantite_reservee
        FROM stocks 
        WHERE magasin_id = ?
      `, [magasinFilter]);
      stats.stock = stockTotal[0];
      
      // Alertes de stock pour ce magasin
      const [alertes] = await pool.query(`
        SELECT COUNT(*) as nb_alertes
        FROM stocks s
        JOIN produits p ON s.produit_id = p.id
        WHERE s.magasin_id = ? 
        AND s.quantite_disponible <= p.seuil_alerte
      `, [magasinFilter]);
      stats.alertes = alertes[0].nb_alertes;
      
      // Mouvements récents du magasin
      const [mouvementsRecents] = await pool.query(`
        SELECT 
          m.type_mouvement,
          m.quantite,
          m.date_mouvement,
          p.nom as produit_nom,
          CASE 
            WHEN m.type_mouvement = 'entree' THEN 'Entrée'
            WHEN m.type_mouvement = 'sortie' THEN 'Sortie'
            WHEN m.type_mouvement = 'transfert' AND m.magasin_destination_id = ? THEN 'Réception transfert'
            WHEN m.type_mouvement = 'transfert' AND m.magasin_source_id = ? THEN 'Envoi transfert'
            ELSE m.type_mouvement
          END as type_affichage
        FROM mouvements_stock m
        JOIN produits p ON m.produit_id = p.id
        WHERE (m.magasin_source_id = ? OR m.magasin_destination_id = ?)
        ORDER BY m.date_mouvement DESC
        LIMIT 10
      `, [magasinFilter, magasinFilter, magasinFilter, magasinFilter]);
      stats.mouvements_recents = mouvementsRecents;
      
      // Navires dispatchés vers ce magasin
      const [naviresDispatches] = await pool.query(`
        SELECT 
          n.nom_navire,
          n.numero_imo,
          n.date_arrivee,
          nd.date_dispatching,
          SUM(nd.quantite) as quantite_totale,
          COUNT(DISTINCT nc.produit_id) as nb_produits
        FROM navires n
        JOIN navire_dispatching nd ON n.id = nd.navire_id
        JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
        WHERE nd.magasin_id = ?
        AND n.statut = 'dispatche'
        GROUP BY n.id
        ORDER BY nd.date_dispatching DESC
        LIMIT 5
      `, [magasinFilter]);
      stats.navires_recents = naviresDispatches;
      
    } else {
      // Stats globales pour admin/manager
      const [totaux] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM magasins) as nb_magasins,
          (SELECT COUNT(*) FROM produits WHERE actif = 1) as nb_produits,
          (SELECT COUNT(*) FROM navires WHERE statut = 'receptionne') as navires_en_attente,
          (SELECT COUNT(*) FROM navires WHERE statut = 'dispatche' AND DATE(date_reception) = CURDATE()) as navires_jour
      `);
      stats.totaux = totaux[0];
      
      // Stock par magasin
      const [stockParMagasin] = await pool.query(`
        SELECT 
          m.id,
          m.nom,
          m.ville,
          COUNT(DISTINCT s.produit_id) as nb_produits,
          SUM(s.quantite_disponible) as quantite_totale
        FROM magasins m
        LEFT JOIN stocks s ON m.id = s.magasin_id
        GROUP BY m.id
        ORDER BY m.nom
      `);
      stats.stock_par_magasin = stockParMagasin;
    }
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erreur getDashboardStats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir les navires en attente de dispatching pour un magasin
exports.getNaviresEnAttente = async (req, res) => {
  try {
    const { role, magasin_id } = req.user;
    
    let query = `
      SELECT 
        n.id,
        n.nom_navire,
        n.numero_imo,
        n.date_arrivee,
        n.date_reception,
        nc.id as cargaison_id,
        nc.produit_id,
        p.nom as produit_nom,
        nc.quantite_declaree,
        nc.quantite_recue,
        nc.unite,
        nc.origine,
        COALESCE(
          (SELECT SUM(nd2.quantite) 
           FROM navire_dispatching nd2 
           WHERE nd2.cargaison_id = nc.id),
          0
        ) as quantite_dispatchee,
        (nc.quantite_recue - COALESCE(
          (SELECT SUM(nd2.quantite) 
           FROM navire_dispatching nd2 
           WHERE nd2.cargaison_id = nc.id),
          0
        )) as quantite_restante
      FROM navires n
      JOIN navire_cargaison nc ON n.id = nc.navire_id
      JOIN produits p ON nc.produit_id = p.id
      WHERE n.statut = 'receptionne'
    `;
    
    // Pour les opérateurs, montrer seulement ce qui pourrait être dispatché vers leur magasin
    if (role === 'operator' && magasin_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM stocks s 
        WHERE s.magasin_id = ? 
        AND s.produit_id = nc.produit_id
      )`;
    }
    
    query += ` ORDER BY n.date_reception DESC`;
    
    const params = (role === 'operator' && magasin_id) ? [magasin_id] : [];
    const [navires] = await pool.query(query, params);
    
    // Grouper par navire
    const naviresGroupes = navires.reduce((acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          nom_navire: row.nom_navire,
          numero_imo: row.numero_imo,
          date_arrivee: row.date_arrivee,
          date_reception: row.date_reception,
          cargaisons: []
        };
      }
      
      if (row.quantite_restante > 0) {
        acc[row.id].cargaisons.push({
          cargaison_id: row.cargaison_id,
          produit_id: row.produit_id,
          produit_nom: row.produit_nom,
          quantite_recue: row.quantite_recue,
          quantite_dispatchee: row.quantite_dispatchee,
          quantite_restante: row.quantite_restante,
          unite: row.unite,
          origine: row.origine
        });
      }
      
      return acc;
    }, {});
    
    // Filtrer les navires qui ont encore de la cargaison à dispatcher
    const naviresAvecCargaison = Object.values(naviresGroupes)
      .filter(n => n.cargaisons.length > 0);
    
    res.json({
      success: true,
      data: naviresAvecCargaison
    });
    
  } catch (error) {
    console.error('Erreur getNaviresEnAttente:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des navires'
    });
  }
};

// Obtenir le total réceptionné depuis la table navires
exports.getTotalReceptionne = async (req, res) => {
  try {
    const { role, magasin_id } = req.user;
    const { produit_id, date_debut, date_fin } = req.query;
    
    let query = `
      SELECT 
        SUM(nc.quantite_recue) as total_receptionne,
        COUNT(DISTINCT n.id) as nombre_navires,
        COUNT(DISTINCT nc.produit_id) as nombre_produits
      FROM navires n
      JOIN navire_cargaison nc ON n.id = nc.navire_id
      WHERE n.statut IN ('receptionne', 'dispatche')
    `;
    
    const params = [];
    
    // Filtrer par produit si spécifié
    if (produit_id) {
      query += ` AND nc.produit_id = ?`;
      params.push(produit_id);
    }
    
    // Filtrer par dates si spécifiées
    if (date_debut) {
      query += ` AND n.date_reception >= ?`;
      params.push(date_debut);
    }
    
    if (date_fin) {
      query += ` AND n.date_reception <= ?`;
      params.push(date_fin);
    }
    
    // Pour les opérateurs, filtrer par leur magasin
    if (role === 'operator' && magasin_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM navire_dispatching nd
        WHERE nd.navire_id = n.id 
        AND nd.magasin_id = ?
      )`;
      params.push(magasin_id);
    }
    
    const [result] = await pool.query(query, params);
    
    // Obtenir aussi le détail par produit si demandé
    let detailParProduit = [];
    if (req.query.detail_produit === 'true') {
      let detailQuery = `
        SELECT 
          nc.produit_id,
          p.nom as produit_nom,
          SUM(nc.quantite_recue) as quantite_recue,
          nc.unite
        FROM navires n
        JOIN navire_cargaison nc ON n.id = nc.navire_id
        JOIN produits p ON nc.produit_id = p.id
        WHERE n.statut IN ('receptionne', 'dispatche')
      `;
      
      const detailParams = [...params];
      
      if (produit_id) {
        detailQuery += ` AND nc.produit_id = ?`;
      }
      
      if (date_debut) {
        detailQuery += ` AND n.date_reception >= ?`;
      }
      
      if (date_fin) {
        detailQuery += ` AND n.date_reception <= ?`;
      }
      
      if (role === 'operator' && magasin_id) {
        detailQuery += ` AND EXISTS (
          SELECT 1 FROM navire_dispatching nd
          WHERE nd.navire_id = n.id 
          AND nd.magasin_id = ?
        )`;
      }
      
      detailQuery += ` GROUP BY nc.produit_id, p.nom, nc.unite ORDER BY p.nom`;
      
      const [details] = await pool.query(detailQuery, detailParams);
      detailParProduit = details;
    }
    
    res.json({
      success: true,
      data: {
        total_receptionne: result[0].total_receptionne || 0,
        nombre_navires: result[0].nombre_navires || 0,
        nombre_produits: result[0].nombre_produits || 0,
        detail_par_produit: detailParProduit
      }
    });
    
  } catch (error) {
    console.error('Erreur getTotalReceptionne:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul du total réceptionné'
    });
  }
};

module.exports = exports;