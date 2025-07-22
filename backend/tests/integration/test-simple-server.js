const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database-mysql');

const app = express();

app.use(cors());
app.use(express.json());

// Test direct endpoint
app.get('/test-magasins', async (req, res) => {
  try {
    console.log('Test magasins endpoint called');
    
    const [magasins] = await pool.execute(`
      SELECT m.*, COUNT(DISTINCT s.produit_id) as nombre_produits
      FROM magasins m
      LEFT JOIN stocks s ON m.id = s.magasin_id
      GROUP BY m.id
    `);
    
    res.json({ success: true, count: magasins.length, data: magasins });
  } catch (error) {
    console.error('Error in test-magasins:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code
    });
  }
});

// Test mouvements
app.get('/test-mouvements', async (req, res) => {
  try {
    console.log('Test mouvements endpoint called');
    
    const [mouvements] = await pool.execute(`
      SELECT m.*, p.nom as produit_nom
      FROM mouvements_stock m
      JOIN produits p ON m.produit_id = p.id
      LIMIT 10
    `);
    
    res.json({ success: true, count: mouvements.length, data: mouvements });
  } catch (error) {
    console.error('Error in test-mouvements:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});