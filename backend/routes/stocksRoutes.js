const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth-mysql');
const db = require('../config/database-mysql');

// GET /api/stocks - Obtenir tous les stocks avec détails
router.get('/', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.produit_id,
        p.nom AS produit_nom,
        p.reference AS produit_reference,
        p.unite,
        s.magasin_id,
        m.nom AS magasin_nom,
        s.quantite_disponible,
        s.quantite_reservee,
        s.quantite_disponible - COALESCE(s.quantite_reservee, 0) AS quantite_libre,
        s.created_at,
        s.updated_at
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE s.quantite_disponible > 0
      ORDER BY m.nom, p.nom
    `;
    
    const [stocks] = await db.execute(query);
    
    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stocks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des stocks',
      error: error.message 
    });
  }
});

// GET /api/stocks/summary - Résumé des stocks pour le dashboard
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Stock total
    const [totalStock] = await db.execute(`
      SELECT 
        COUNT(DISTINCT produit_id) as nombre_produits,
        COUNT(DISTINCT magasin_id) as nombre_magasins,
        SUM(quantite_disponible) as quantite_totale,
        SUM(quantite_disponible * p.prix_tonne) as valeur_totale
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      WHERE s.quantite_disponible > 0
    `);
    
    // Stock par catégorie
    const [stockParCategorie] = await db.execute(`
      SELECT 
        p.categorie,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        SUM(s.quantite_disponible) as quantite_totale
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      WHERE s.quantite_disponible > 0
      GROUP BY p.categorie
      ORDER BY quantite_totale DESC
    `);
    
    // Produits en alerte (stock bas)
    const [produitsEnAlerte] = await db.execute(`
      SELECT 
        p.nom as produit_nom,
        p.seuil_alerte,
        SUM(s.quantite_disponible) as stock_actuel,
        COUNT(DISTINCT s.magasin_id) as nombre_magasins
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      GROUP BY p.id, p.nom, p.seuil_alerte
      HAVING stock_actuel <= p.seuil_alerte
      ORDER BY stock_actuel ASC
    `);
    
    res.json({
      success: true,
      data: {
        total: totalStock[0],
        parCategorie: stockParCategorie,
        alertes: produitsEnAlerte
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul du résumé:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du calcul du résumé',
      error: error.message 
    });
  }
});

// GET /api/stocks/by-magasin - Stocks groupés par magasin
router.get('/by-magasin', authenticate, async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id as magasin_id,
        m.nom as magasin_nom,
        m.ville,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        SUM(s.quantite_disponible) as stock_total,
        SUM(s.quantite_disponible * p.prix_tonne) as valeur_stock
      FROM magasins m
      LEFT JOIN stocks s ON s.magasin_id = m.id AND s.quantite_disponible > 0
      LEFT JOIN produits p ON s.produit_id = p.id
      WHERE m.actif = 1
      GROUP BY m.id, m.nom, m.ville
      ORDER BY stock_total DESC
    `;
    
    const [stocksParMagasin] = await db.execute(query);
    
    res.json({
      success: true,
      data: stocksParMagasin
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stocks par magasin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des stocks par magasin',
      error: error.message 
    });
  }
});

// GET /api/stocks/produit/:produit_id - Stock d'un produit dans tous les magasins
router.get('/produit/:produit_id', authenticate, async (req, res) => {
  try {
    const { produit_id } = req.params;
    
    const query = `
      SELECT 
        s.id,
        s.magasin_id,
        m.nom as magasin_nom,
        m.ville,
        s.quantite_disponible,
        s.quantite_reservee,
        s.quantite_disponible - COALESCE(s.quantite_reservee, 0) as quantite_libre,
        p.nom as produit_nom,
        p.unite,
        s.updated_at
      FROM stocks s
      JOIN magasins m ON s.magasin_id = m.id
      JOIN produits p ON s.produit_id = p.id
      WHERE s.produit_id = ?
      AND s.quantite_disponible > 0
      ORDER BY s.quantite_disponible DESC
    `;
    
    const [stocks] = await db.execute(query, [produit_id]);
    
    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du stock produit:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du stock produit',
      error: error.message 
    });
  }
});

module.exports = router;