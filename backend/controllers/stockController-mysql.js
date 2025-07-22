const { pool } = require('../config/database-mysql');

// Récupérer le stock par magasin
exports.getStockByMagasin = async (req, res) => {
  try {
    const { magasin_id } = req.params;
    const { categorie, low_stock, search } = req.query;
    
    // Vérifier l'accès au magasin pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id !== magasin_id) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à ce magasin'
      });
    }
    
    let query = `
      SELECT 
        s.id,
        s.produit_id,
        s.magasin_id,
        s.quantite_disponible,
        s.quantite_reservee,
        s.derniere_entree,
        s.derniere_sortie,
        p.reference as produit_reference,
        p.nom as produit_nom,
        p.categorie,
        p.unite,
        p.seuil_alerte,
        p.prix_unitaire,
        m.nom as magasin_nom,
        (s.quantite_disponible <= p.seuil_alerte) as stock_faible
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE s.magasin_id = ? AND p.actif = 1
    `;
    
    const params = [magasin_id];
    
    if (categorie) {
      query += ` AND p.categorie = ?`;
      params.push(categorie);
    }
    
    if (search) {
      query += ` AND (p.nom LIKE ? OR p.reference LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (low_stock === 'true') {
      query += ` AND s.quantite_disponible <= p.seuil_alerte`;
    }
    
    query += ` ORDER BY p.nom ASC`;
    
    const [stocks] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur getStockByMagasin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock'
    });
  }
};

// Récupérer tous les stocks de tous les magasins
exports.getAllStocks = async (req, res) => {
  try {
    const { categorie, low_stock, search, magasin_id } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.produit_id,
        s.magasin_id,
        s.quantite_disponible,
        s.quantite_reservee,
        s.derniere_entree,
        s.derniere_sortie,
        p.reference as produit_reference,
        p.nom as produit_nom,
        p.categorie,
        p.unite,
        p.seuil_alerte,
        p.prix_unitaire,
        m.nom as magasin_nom,
        m.localisation as magasin_localisation,
        (s.quantite_disponible <= p.seuil_alerte) as stock_faible
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE p.actif = 1
    `;
    
    const params = [];
    
    // Filtrer par magasin pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(req.user.magasin_id);
    } else if (magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(magasin_id);
    }
    
    if (categorie) {
      query += ` AND p.categorie = ?`;
      params.push(categorie);
    }
    
    if (search) {
      query += ` AND (p.nom LIKE ? OR p.reference LIKE ? OR m.nom LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (low_stock === 'true') {
      query += ` AND s.quantite_disponible <= p.seuil_alerte`;
    }
    
    query += ` ORDER BY m.nom ASC, p.nom ASC`;
    
    const [stocks] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur getAllStocks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des stocks'
    });
  }
};

// Récupérer le stock global (tous magasins)
exports.getStockGlobal = async (req, res) => {
  try {
    const { produit_id } = req.query;
    
    let query = `
      SELECT 
        p.id as produit_id,
        p.reference as produit_reference,
        p.nom as produit_nom,
        p.categorie,
        p.unite,
        SUM(s.quantite_disponible) as quantite_totale,
        SUM(s.quantite_reservee) as quantite_reservee_totale,
        GROUP_CONCAT(
          JSON_OBJECT(
            'magasin_id', m.id,
            'magasin_nom', m.nom,
            'quantite', s.quantite_disponible,
            'reservee', s.quantite_reservee
          )
        ) as distribution
      FROM produits p
      LEFT JOIN stocks s ON p.id = s.produit_id
      LEFT JOIN magasins m ON s.magasin_id = m.id
      WHERE p.actif = 1
    `;
    
    const params = [];
    
    // Filtrer par magasin pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(req.user.magasin_id);
    }
    
    if (produit_id) {
      query += ` AND p.id = ?`;
      params.push(produit_id);
    }
    
    query += ` GROUP BY p.id ORDER BY p.nom ASC`;
    
    const [stocks] = await pool.query(query, params);
    
    // Parser la distribution JSON
    stocks.forEach(stock => {
      if (stock.distribution) {
        stock.distribution = stock.distribution
          .split('},{')
          .map(d => d.replace(/[{}]/g, ''))
          .map(d => {
            try {
              return JSON.parse('{' + d + '}');
            } catch {
              return null;
            }
          })
          .filter(d => d !== null);
      } else {
        stock.distribution = [];
      }
    });
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur getStockGlobal:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock global'
    });
  }
};

// Mettre à jour le stock (ajustement)
exports.adjustStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { produit_id, magasin_id, nouvelle_quantite, motif } = req.body;
    
    // Récupérer la quantité actuelle
    const [currentStock] = await connection.query(
      'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
      [produit_id, magasin_id]
    );
    
    const quantiteActuelle = currentStock[0]?.quantite_disponible || 0;
    const difference = nouvelle_quantite - quantiteActuelle;
    
    // Mettre à jour le stock
    await connection.execute(`
      INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantite_disponible = ?
    `, [produit_id, magasin_id, nouvelle_quantite, nouvelle_quantite]);
    
    // Créer le mouvement d'ajustement
    await connection.execute(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id,
        quantite, reference_document, description, created_by
      ) VALUES ('ajustement', ?, ?, ?, ?, ?, ?)
    `, [
      produit_id, magasin_id, Math.abs(difference),
      `ADJ-${Date.now()}`, motif, req.userId
    ]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Stock ajusté avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur adjustStock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajustement du stock'
    });
  } finally {
    connection.release();
  }
};

// Récupérer les mouvements de stock
exports.getStockMovements = async (req, res) => {
  try {
    const { magasin_id } = req.params;
    const { type, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        m.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        u.nom as user_nom,
        u.prenom as user_prenom
      FROM mouvements_stock m
      JOIN produits p ON m.produit_id = p.id
      LEFT JOIN utilisateurs u ON m.created_by = u.id
      WHERE (m.magasin_source_id = ? OR m.magasin_destination_id = ?)
    `;
    
    const params = [magasin_id, magasin_id];
    
    if (type) {
      query += ` AND m.type_mouvement = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY m.date_mouvement DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [mouvements] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: mouvements
    });
    
  } catch (error) {
    console.error('Erreur getStockMovements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des mouvements'
    });
  }
};

// Ajouter du stock (entrée)
exports.addStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { produit_id, magasin_id, quantite, reference_document, description } = req.body;
    
    // Créer le mouvement d'entrée
    await connection.execute(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_destination_id,
        quantite, reference_document, description, created_by
      ) VALUES ('entree', ?, ?, ?, ?, ?, ?)
    `, [produit_id, magasin_id, quantite, reference_document, description, req.userId]);
    
    // Mettre à jour le stock
    await connection.execute(`
      INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
      quantite_disponible = quantite_disponible + VALUES(quantite_disponible),
      derniere_entree = NOW()
    `, [produit_id, magasin_id, quantite]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Stock ajouté avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur addStock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'ajout du stock'
    });
  } finally {
    connection.release();
  }
};

// Retirer du stock (sortie)
exports.removeStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { produit_id, magasin_id, quantite, reference_document, description } = req.body;
    
    // Vérifier le stock disponible
    const [stock] = await connection.query(
      'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
      [produit_id, magasin_id]
    );
    
    if (!stock[0] || stock[0].quantite_disponible < quantite) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Stock insuffisant'
      });
    }
    
    // Créer le mouvement de sortie
    await connection.execute(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_source_id,
        quantite, reference_document, description, created_by
      ) VALUES ('sortie', ?, ?, ?, ?, ?, ?)
    `, [produit_id, magasin_id, quantite, reference_document, description, req.userId]);
    
    // Mettre à jour le stock
    await connection.execute(`
      UPDATE stocks 
      SET quantite_disponible = quantite_disponible - ?,
          derniere_sortie = NOW()
      WHERE produit_id = ? AND magasin_id = ?
    `, [quantite, produit_id, magasin_id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Stock retiré avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur removeStock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du retrait du stock'
    });
  } finally {
    connection.release();
  }
};

// Transférer du stock
exports.transferStock = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { produit_id, magasin_source_id, magasin_destination_id, quantite, reference_document, description } = req.body;
    
    // Vérifier le stock disponible
    const [stock] = await connection.query(
      'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
      [produit_id, magasin_source_id]
    );
    
    if (!stock[0] || stock[0].quantite_disponible < quantite) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Stock insuffisant dans le magasin source'
      });
    }
    
    // Créer le mouvement de transfert
    await connection.execute(`
      INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_source_id, magasin_destination_id,
        quantite, reference_document, description, created_by
      ) VALUES ('transfert', ?, ?, ?, ?, ?, ?, ?)
    `, [produit_id, magasin_source_id, magasin_destination_id, quantite, reference_document, description, req.userId]);
    
    // Retirer du magasin source
    await connection.execute(`
      UPDATE stocks 
      SET quantite_disponible = quantite_disponible - ?,
          derniere_sortie = NOW()
      WHERE produit_id = ? AND magasin_id = ?
    `, [quantite, produit_id, magasin_source_id]);
    
    // Ajouter au magasin destination
    await connection.execute(`
      INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
      quantite_disponible = quantite_disponible + VALUES(quantite_disponible),
      derniere_entree = NOW()
    `, [produit_id, magasin_destination_id, quantite]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Stock transféré avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur transferStock:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du transfert du stock'
    });
  } finally {
    connection.release();
  }
};

// Récupérer le stock par produit
exports.getStockByProduct = async (req, res) => {
  try {
    const { produit_id } = req.params;
    
    let query = `
      SELECT 
        s.*,
        m.nom as magasin_nom,
        m.ville as magasin_ville,
        p.nom as produit_nom,
        p.reference as produit_reference
      FROM stocks s
      JOIN magasins m ON s.magasin_id = m.id
      JOIN produits p ON s.produit_id = p.id
      WHERE s.produit_id = ?
    `;
    
    const params = [produit_id];
    
    // Filtrer par magasin pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(req.user.magasin_id);
    }
    
    query += ` ORDER BY m.nom ASC`;
    
    const [stocks] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: stocks
    });
    
  } catch (error) {
    console.error('Erreur getStockByProduct:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock'
    });
  }
};

// Obtenir les alertes de stock
exports.getStockAlerts = async (req, res) => {
  try {
    let query = `
      SELECT 
        s.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        p.seuil_alerte,
        m.nom as magasin_nom
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
      WHERE s.quantite_disponible <= p.seuil_alerte
    `;
    
    const params = [];
    
    // Filtrer par magasin pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id) {
      query += ` AND s.magasin_id = ?`;
      params.push(req.user.magasin_id);
    }
    
    query += ` ORDER BY (s.quantite_disponible / p.seuil_alerte) ASC`;
    
    const [alerts] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: alerts
    });
    
  } catch (error) {
    console.error('Erreur getStockAlerts:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des alertes'
    });
  }
};

// Obtenir le stock disponible pour un produit dans un magasin
exports.getStockDisponible = async (req, res) => {
  try {
    const { produit_id, magasin_id } = req.query;
    
    if (!produit_id || !magasin_id) {
      return res.status(400).json({
        success: false,
        error: 'produit_id et magasin_id sont requis'
      });
    }
    
    const [result] = await pool.query(`
      SELECT 
        quantite_actuelle as quantite
      FROM stocks 
      WHERE produit_id = ? AND magasin_id = ?
    `, [produit_id, magasin_id]);
    
    const quantite = result[0]?.quantite || 0;
    
    res.json({
      success: true,
      quantite: parseFloat(quantite),
      data: {
        produit_id,
        magasin_id,
        quantite: parseFloat(quantite)
      }
    });
    
  } catch (error) {
    console.error('Erreur getStockDisponible:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du stock disponible'
    });
  }
};

module.exports = exports;