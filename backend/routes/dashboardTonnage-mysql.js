const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth-mysql');
const db = require('../config/database-mysql');

// GET /api/dashboard-tonnage/tonnage - Statistiques de tonnage pour le dashboard
router.get('/tonnage', authenticate, async (req, res) => {
  try {
    // Tonnage total en stock
    const [totalStock] = await db.execute(`
      SELECT 
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COUNT(DISTINCT s.magasin_id) as nombre_magasins,
        ROUND(SUM(s.quantite_disponible), 2) as tonnage_total,
        ROUND(SUM(s.quantite_disponible * p.prix_tonne), 2) as valeur_totale
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      WHERE s.quantite_disponible > 0
    `);

    // Mouvements du jour
    const [mouvementsJour] = await db.execute(`
      SELECT 
        type_mouvement,
        COUNT(*) as nombre,
        ROUND(SUM(quantite), 2) as tonnage
      FROM mouvements_stock
      WHERE DATE(date_mouvement) = CURDATE()
      GROUP BY type_mouvement
    `);

    // Navires en cours
    const [naviresEnCours] = await db.execute(`
      SELECT COUNT(*) as nombre
      FROM navires
      WHERE statut = 'receptionne'
      AND DATE(date_arrivee) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    // Dispatches en attente
    const [dispatchesEnAttente] = await db.execute(`
      SELECT COUNT(DISTINCT navire_id) as nombre_navires,
             ROUND(SUM(quantite), 2) as tonnage_en_attente
      FROM navire_dispatching
      WHERE date_reception IS NULL
    `);

    res.json({
      success: true,
      data: {
        stock: totalStock[0],
        mouvements_jour: mouvementsJour,
        navires_en_cours: naviresEnCours[0].nombre,
        dispatches_en_attente: dispatchesEnAttente[0]
      }
    });
  } catch (error) {
    console.error('Erreur dashboard tonnage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des données',
      error: error.message 
    });
  }
});

// GET /api/dashboard-tonnage/stocks-magasins - Stocks par magasin
router.get('/stocks-magasins', authenticate, async (req, res) => {
  try {
    const [stocksMagasins] = await db.execute(`
      SELECT 
        m.id,
        m.nom,
        m.ville,
        m.capacite_tonnes,
        COALESCE(ROUND(SUM(s.quantite_disponible), 2), 0) as stock_total,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        ROUND((COALESCE(SUM(s.quantite_disponible), 0) / NULLIF(m.capacite_tonnes, 0)) * 100, 2) as taux_occupation
      FROM magasins m
      LEFT JOIN stocks s ON s.magasin_id = m.id AND s.quantite_disponible > 0
      WHERE m.actif = 1
      GROUP BY m.id, m.nom, m.ville, m.capacite_tonnes
      ORDER BY stock_total DESC
    `);

    res.json({
      success: true,
      data: stocksMagasins
    });
  } catch (error) {
    console.error('Erreur stocks magasins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des stocks par magasin',
      error: error.message 
    });
  }
});

// GET /api/dashboard-tonnage/evolution-stock/:magasinId - Evolution du stock d'un magasin
router.get('/evolution-stock/:magasinId', authenticate, async (req, res) => {
  try {
    const { magasinId } = req.params;
    const { date_debut, date_fin } = req.query;
    
    // Dates par défaut : 7 derniers jours
    const endDate = date_fin || new Date().toISOString().split('T')[0];
    const startDate = date_debut || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [evolution] = await db.execute(`
      SELECT 
        DATE(date_mouvement) as date,
        SUM(CASE 
          WHEN type_mouvement = 'entree' AND magasin_destination_id = ? THEN quantite
          WHEN type_mouvement = 'dispatch' AND magasin_destination_id = ? THEN quantite
          ELSE 0 
        END) as entrees,
        SUM(CASE 
          WHEN type_mouvement = 'sortie' AND magasin_source_id = ? THEN quantite
          ELSE 0 
        END) as sorties
      FROM mouvements_stock
      WHERE DATE(date_mouvement) BETWEEN ? AND ?
      AND (magasin_source_id = ? OR magasin_destination_id = ?)
      GROUP BY DATE(date_mouvement)
      ORDER BY date
    `, [magasinId, magasinId, magasinId, startDate, endDate, magasinId, magasinId]);

    // Stock actuel
    const [[stockActuel]] = await db.execute(`
      SELECT COALESCE(SUM(quantite_disponible), 0) as stock_actuel
      FROM stocks
      WHERE magasin_id = ?
    `, [magasinId]);

    res.json({
      success: true,
      data: {
        magasin_id: magasinId,
        periode: { debut: startDate, fin: endDate },
        stock_actuel: stockActuel.stock_actuel,
        evolution: evolution
      }
    });
  } catch (error) {
    console.error('Erreur evolution stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de l\'évolution',
      error: error.message 
    });
  }
});

// GET /api/dashboard-tonnage/mouvements-recents - Mouvements récents
router.get('/mouvements-recents', authenticate, async (req, res) => {
  try {
    const { magasin_id, limit = 10 } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (magasin_id) {
      whereClause = 'WHERE (m.magasin_source_id = ? OR m.magasin_destination_id = ?)';
      params = [magasin_id, magasin_id];
    }
    
    params.push(parseInt(limit));

    const query = `
      SELECT 
        m.id,
        m.type_mouvement,
        m.quantite,
        m.reference_document,
        m.date_mouvement,
        m.description,
        p.nom as produit_nom,
        mag_src.nom as magasin_source,
        mag_dest.nom as magasin_destination,
        u.nom as operateur_nom,
        u.prenom as operateur_prenom
      FROM mouvements_stock m
      JOIN produits p ON m.produit_id = p.id
      LEFT JOIN magasins mag_src ON m.magasin_source_id = mag_src.id
      LEFT JOIN magasins mag_dest ON m.magasin_destination_id = mag_dest.id
      JOIN utilisateurs u ON m.created_by = u.id
      ${whereClause}
      ORDER BY m.date_mouvement DESC
      LIMIT ?
    `;

    const [mouvements] = await db.execute(query, params);

    res.json({
      success: true,
      data: mouvements
    });
  } catch (error) {
    console.error('Erreur mouvements récents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des mouvements',
      error: error.message 
    });
  }
});

// GET /api/dashboard-tonnage/alertes-stock - Alertes de stock bas
router.get('/alertes-stock', authenticate, async (req, res) => {
  try {
    const [alertes] = await db.execute(`
      SELECT 
        p.id as produit_id,
        p.nom as produit_nom,
        p.reference,
        p.seuil_alerte,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total,
        COUNT(DISTINCT s.magasin_id) as nombre_magasins,
        GROUP_CONCAT(DISTINCT m.nom) as magasins
      FROM produits p
      LEFT JOIN stocks s ON s.produit_id = p.id AND s.quantite_disponible > 0
      LEFT JOIN magasins m ON s.magasin_id = m.id
      WHERE p.actif = 1
      GROUP BY p.id, p.nom, p.reference, p.seuil_alerte
      HAVING stock_total <= p.seuil_alerte
      ORDER BY stock_total ASC
    `);

    res.json({
      success: true,
      data: alertes
    });
  } catch (error) {
    console.error('Erreur alertes stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des alertes',
      error: error.message 
    });
  }
});

// GET /api/dashboard-tonnage/stats-magasin/:magasinId - Statistiques d'un magasin
router.get('/stats-magasin/:magasinId', authenticate, async (req, res) => {
  try {
    const { magasinId } = req.params;
    const { date_debut, date_fin } = req.query;

    // Vérifier l'accès pour les operators
    if (req.user.role === 'operator' && req.user.magasin_id !== magasinId) {
      return res.status(403).json({ 
        success: false,
        message: 'Accès refusé à ce magasin' 
      });
    }

    // Calculer les statistiques
    let dateCondition = '';
    let params = [magasinId, magasinId, magasinId, magasinId];
    
    if (date_debut && date_fin) {
      dateCondition = 'AND DATE(date_mouvement) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }

    const [stats] = await db.execute(`
      SELECT 
        SUM(CASE 
          WHEN type_mouvement IN ('entree', 'dispatch') AND magasin_destination_id = ? 
          THEN quantite ELSE 0 
        END) as total_entrees,
        SUM(CASE 
          WHEN type_mouvement = 'sortie' AND magasin_source_id = ? 
          THEN quantite ELSE 0 
        END) as total_sorties,
        COUNT(CASE 
          WHEN type_mouvement IN ('entree', 'dispatch') AND magasin_destination_id = ? 
          THEN 1 ELSE NULL 
        END) as nombre_entrees,
        COUNT(CASE 
          WHEN type_mouvement = 'sortie' AND magasin_source_id = ? 
          THEN 1 ELSE NULL 
        END) as nombre_sorties
      FROM mouvements_stock
      WHERE 1=1 ${dateCondition}
    `, params);

    // Stock actuel
    const [[stockActuel]] = await db.execute(`
      SELECT COALESCE(SUM(quantite_disponible), 0) as stock_actuel
      FROM stocks
      WHERE magasin_id = ?
    `, [magasinId]);

    // Info magasin
    const [[magasin]] = await db.execute(`
      SELECT nom, ville, capacite_tonnes
      FROM magasins
      WHERE id = ?
    `, [magasinId]);

    const totalEntrees = parseFloat(stats[0].total_entrees) || 0;
    const totalSorties = parseFloat(stats[0].total_sorties) || 0;
    const tauxRotation = totalEntrees > 0 ? (totalSorties / totalEntrees) * 100 : 0;

    res.json({
      success: true,
      data: {
        magasin: magasin,
        total_entrees: totalEntrees,
        total_sorties: totalSorties,
        stock_actuel: parseFloat(stockActuel.stock_actuel),
        taux_rotation: tauxRotation.toFixed(2),
        nombre_entrees: stats[0].nombre_entrees,
        nombre_sorties: stats[0].nombre_sorties,
        taux_occupation: magasin.capacite_tonnes > 0 
          ? ((parseFloat(stockActuel.stock_actuel) / magasin.capacite_tonnes) * 100).toFixed(2)
          : 0,
        periode: {
          debut: date_debut || 'Toute période',
          fin: date_fin || 'Toute période'
        }
      }
    });
  } catch (error) {
    console.error('Erreur stats magasin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
});

module.exports = router;