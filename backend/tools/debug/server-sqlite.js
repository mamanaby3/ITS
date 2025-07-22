require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Base de données SQLite
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
};

// Routes d'authentification
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM utilisateurs WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    // Mettre à jour la dernière connexion
    db.prepare('UPDATE utilisateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          magasin_id: user.magasin_id
        }
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Magasins
app.get('/api/magasins', authMiddleware, (req, res) => {
  try {
    const magasins = db.prepare('SELECT * FROM magasins WHERE actif = 1').all();
    res.json({ success: true, data: magasins });
  } catch (error) {
    console.error('Erreur magasins:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.get('/api/magasins/:id', authMiddleware, (req, res) => {
  try {
    const magasin = db.prepare('SELECT * FROM magasins WHERE id = ?').get(req.params.id);
    if (!magasin) {
      return res.status(404).json({ success: false, error: 'Magasin non trouvé' });
    }
    res.json({ success: true, data: magasin });
  } catch (error) {
    console.error('Erreur magasin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Produits
app.get('/api/produits', authMiddleware, (req, res) => {
  try {
    const produits = db.prepare('SELECT * FROM produits WHERE actif = 1').all();
    res.json({ success: true, data: produits });
  } catch (error) {
    console.error('Erreur produits:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Stock
app.get('/api/stock', authMiddleware, (req, res) => {
  try {
    const { magasin_id } = req.query;
    let query = `
      SELECT s.*, p.nom as produit_nom, p.categorie, p.unite_mesure, m.nom as magasin_nom
      FROM stocks s
      JOIN produits p ON s.produit_id = p.id
      JOIN magasins m ON s.magasin_id = m.id
    `;
    
    const params = [];
    if (magasin_id) {
      query += ' WHERE s.magasin_id = ?';
      params.push(magasin_id);
    }

    const stocks = db.prepare(query).all(...params);
    res.json({ success: true, data: stocks });
  } catch (error) {
    console.error('Erreur stock:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Navires
app.get('/api/navires', authMiddleware, (req, res) => {
  try {
    const navires = db.prepare('SELECT * FROM navires ORDER BY date_arrivee DESC').all();
    res.json({ success: true, data: navires });
  } catch (error) {
    console.error('Erreur navires:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

app.post('/api/navires/reception', authMiddleware, (req, res) => {
  const { navire, produits } = req.body;
  
  try {
    db.exec('BEGIN TRANSACTION');
    
    // Créer le navire
    const navireStmt = db.prepare(`
      INSERT INTO navires (nom, numero_imo, date_arrivee, port_origine, statut)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = navireStmt.run(
      navire.nom,
      navire.numero_imo,
      navire.date_arrivee,
      navire.port_origine,
      'en_reception'
    );
    
    const navireId = result.lastInsertRowid;
    
    // Créer les réceptions
    const receptionStmt = db.prepare(`
      INSERT INTO receptions_navires (navire_id, produit_id, quantite_declaree, utilisateur_id)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const produit of produits) {
      receptionStmt.run(navireId, produit.produit_id, produit.quantite, req.user.id);
    }
    
    db.exec('COMMIT');
    
    res.json({ success: true, data: { navire_id: navireId } });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Erreur réception navire:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Routes Dashboard
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const stats = {
      totalProduits: db.prepare('SELECT COUNT(*) as count FROM produits WHERE actif = 1').get().count,
      totalMagasins: db.prepare('SELECT COUNT(*) as count FROM magasins WHERE actif = 1').get().count,
      stockTotal: db.prepare('SELECT SUM(quantite) as total FROM stocks').get().total || 0,
      mouvementsJour: db.prepare(
        "SELECT COUNT(*) as count FROM mouvements_stock WHERE date(created_at) = date('now')"
      ).get().count
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Erreur serveur' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Base de données: SQLite`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Par défaut'}`);
});