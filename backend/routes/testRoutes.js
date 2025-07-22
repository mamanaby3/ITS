const express = require('express');
const router = express.Router();
const { pool } = require('../config/database-mysql');

// Test endpoint without auth
router.get('/test-db', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM magasins');
    res.json({ success: true, count: result[0].count });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      sql: error.sql
    });
  }
});

// Test magasins query
router.get('/test-magasins', async (req, res) => {
  try {
    const [magasins] = await pool.execute(`
      SELECT 
        m.*,
        COUNT(DISTINCT s.produit_id) as nombre_produits,
        COALESCE(SUM(s.quantite_disponible), 0) as stock_total
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id, m.nom, m.ville, m.zone, m.adresse, m.capacite, m.telephone, m.responsable, m.capacite_max, m.created_at, m.updated_at
      ORDER BY m.nom
    `);
    
    res.json({ success: true, data: magasins });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
  }
});

module.exports = router;