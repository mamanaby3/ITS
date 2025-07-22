const db = require('../config/database-mysql');

// Récupérer toutes les livraisons
exports.getAllLivraisons = async (req, res) => {
  try {
    const { magasin_id, statut, date_livraison, transporteur } = req.query;
    
    let query = `
      SELECT 
        l.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        c.nom as client_nom,
        m.nom as magasin_nom,
        u.nom as created_by_nom,
        u.prenom as created_by_prenom
      FROM livraisons l
      LEFT JOIN produits p ON l.produit_id = p.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN magasins m ON l.magasin_id = m.id
      LEFT JOIN utilisateurs u ON l.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (magasin_id) {
      query += ' AND l.magasin_id = ?';
      params.push(magasin_id);
    }
    
    if (statut) {
      query += ' AND l.statut = ?';
      params.push(statut);
    }
    
    if (transporteur) {
      query += ' AND l.transporteur LIKE ?';
      params.push(`%${transporteur}%`);
    }
    
    if (date_livraison) {
      query += ' AND DATE(l.date_livraison) = ?';
      params.push(date_livraison);
    }
    
    query += ' ORDER BY l.date_livraison DESC, l.created_at DESC';
    
    const [livraisons] = await db.execute(query, params);
    
    res.json({ 
      success: true, 
      data: livraisons 
    });
    
  } catch (error) {
    console.error('Erreur récupération livraisons:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des livraisons',
      details: error.message
    });
  }
};

// Récupérer une livraison par ID
exports.getLivraisonById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [livraison] = await db.execute(`
      SELECT 
        l.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        c.nom as client_nom,
        m.nom as magasin_nom
      FROM livraisons l
      LEFT JOIN produits p ON l.produit_id = p.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN magasins m ON l.magasin_id = m.id
      WHERE l.id = ?
    `, [id]);
    
    if (livraison.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Livraison non trouvée' 
      });
    }
    
    res.json({ 
      success: true, 
      data: livraison[0] 
    });
    
  } catch (error) {
    console.error('Erreur récupération livraison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la livraison' 
    });
  }
};

// Créer une nouvelle livraison
exports.createLivraison = async (req, res) => {
  console.log('=== CREATE LIVRAISON ===');
  console.log('Body reçu:', req.body);
  console.log('User ID:', req.userId);
  
  const connection = await db.beginTransaction();
  
  try {
    const {
      produit_id,
      quantite,
      date_livraison,
      client_id,
      magasin_id,
      transporteur,
      numero_camion,
      chauffeur,
      permis_chauffeur,
      telephone_chauffeur,
      numero_bon_livraison,
      destination,
      statut = 'en_cours',
      observations
    } = req.body;
    
    // Validation basique
    if (!produit_id || !quantite || !date_livraison) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Les champs produit, quantité et date sont obligatoires'
      });
    }
    
    // Vérifier le stock disponible si un magasin est spécifié
    if (magasin_id) {
      const [stockCheck] = await connection.execute(`
        SELECT 
          COALESCE(SUM(nd.quantite), 0) as total_entrees,
          COALESCE((
            SELECT SUM(l.quantite) 
            FROM livraisons l 
            WHERE l.magasin_id = ? 
            AND l.produit_id = ?
            AND l.statut IN ('livree', 'confirmee', 'en_cours')
          ), 0) as total_sorties,
          (COALESCE(SUM(nd.quantite), 0) - COALESCE((
            SELECT SUM(l.quantite) 
            FROM livraisons l 
            WHERE l.magasin_id = ? 
            AND l.produit_id = ?
            AND l.statut IN ('livree', 'confirmee', 'en_cours')
          ), 0)) as stock_disponible
        FROM navire_dispatching nd
        JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
        WHERE nd.magasin_id = ? AND nc.produit_id = ?
      `, [magasin_id, produit_id, magasin_id, produit_id, magasin_id, produit_id]);
      
      const stockDisponible = stockCheck[0]?.stock_disponible || 0;
      
      if (quantite > stockDisponible) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: `Stock insuffisant. Stock disponible: ${stockDisponible} T, quantité demandée: ${quantite} T`
        });
      }
    }
    
    // Créer la livraison
    const [result] = await connection.execute(`
      INSERT INTO livraisons (
        produit_id, quantite, date_livraison, client_id, magasin_id,
        transporteur, numero_camion, chauffeur, permis_chauffeur, telephone_chauffeur,
        numero_bon_livraison, destination, statut, observations, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      produit_id,
      quantite,
      date_livraison,
      client_id || null,
      magasin_id || null,
      transporteur || null,
      numero_camion || null,
      chauffeur || null,
      permis_chauffeur || null,
      telephone_chauffeur || null,
      numero_bon_livraison || null,
      destination || null,
      statut,
      observations || null,
      req.userId || null
    ]);
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        ...req.body
      },
      message: 'Livraison créée avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur création livraison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la livraison',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

// Mettre à jour une livraison
exports.updateLivraison = async (req, res) => {
  const connection = await db.beginTransaction();
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Vérifier que la livraison existe
    const [existing] = await connection.execute(
      'SELECT id FROM livraisons WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Livraison non trouvée'
      });
    }
    
    // Construire la requête UPDATE dynamiquement
    const updateFields = [];
    const values = [];
    
    const allowedFields = [
      'quantite', 'date_livraison', 'client_id', 'magasin_id',
      'transporteur', 'numero_camion', 'chauffeur', 'permis_chauffeur',
      'telephone_chauffeur', 'numero_bon_livraison', 'destination',
      'statut', 'observations'
    ];
    
    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }
    
    if (updateFields.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Aucun champ à mettre à jour'
      });
    }
    
    values.push(id);
    
    await connection.execute(
      `UPDATE livraisons SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Livraison mise à jour avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur mise à jour livraison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour de la livraison' 
    });
  } finally {
    connection.release();
  }
};

// Mettre à jour le statut d'une livraison
exports.updateLivraisonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const validStatuts = ['programmee', 'en_cours', 'livre', 'annulee'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }
    
    await db.execute(
      'UPDATE livraisons SET statut = ? WHERE id = ?',
      [statut, id]
    );
    
    res.json({
      success: true,
      message: 'Statut mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
};

// Annuler une livraison
exports.cancelLivraison = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute(
      'UPDATE livraisons SET statut = ? WHERE id = ?',
      ['annulee', id]
    );
    
    res.json({
      success: true,
      message: 'Livraison annulée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur annulation livraison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'annulation de la livraison' 
    });
  }
};

// Récupérer les livraisons du jour
exports.getTodayLivraisons = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [livraisons] = await db.execute(`
      SELECT 
        l.*,
        p.nom as produit_nom,
        p.reference as produit_reference,
        c.nom as client_nom,
        m.nom as magasin_nom
      FROM livraisons l
      LEFT JOIN produits p ON l.produit_id = p.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN magasins m ON l.magasin_id = m.id
      WHERE DATE(l.date_livraison) = ?
      ORDER BY l.created_at DESC
    `, [today]);
    
    res.json({ 
      success: true, 
      data: livraisons 
    });
    
  } catch (error) {
    console.error('Erreur récupération livraisons du jour:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des livraisons du jour' 
    });
  }
};

module.exports = exports;