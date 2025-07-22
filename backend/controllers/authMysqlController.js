const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database-mysql');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'its_maritime_stock_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(
    { userId },
    secret,
    { expiresIn }
  );
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = ? AND actif = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    await pool.execute(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
      [user.id]
    );

    const token = generateToken(user.id);

    // Récupérer le magasin si nécessaire
    let magasin = null;
    if (user.magasin_id) {
      const [magasins] = await pool.query(
        'SELECT * FROM magasins WHERE id = ?',
        [user.magasin_id]
      );
      if (magasins.length > 0) {
        magasin = magasins[0];
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        magasin_id: user.magasin_id,
        magasin: magasin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la connexion' 
    });
  }
};

exports.me = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, nom, prenom, role, magasin_id FROM utilisateurs WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];
    
    // Récupérer le magasin si nécessaire
    let magasin = null;
    if (user.magasin_id) {
      const [magasins] = await pool.query(
        'SELECT * FROM magasins WHERE id = ?',
        [user.magasin_id]
      );
      if (magasins.length > 0) {
        magasin = magasins[0];
      }
    }

    res.json({
      success: true,
      user: {
        ...user,
        magasin
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des informations'
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur actuel
    const [users] = await pool.query(
      'SELECT password_hash FROM utilisateurs WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await pool.execute(
      'UPDATE utilisateurs SET password_hash = ? WHERE id = ?',
      [hashedPassword, req.userId]
    );

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du mot de passe'
    });
  }
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, nom, prenom, role = 'operator' } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (email, password_hash, nom, prenom, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, nom, prenom, role]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: result.insertId,
        email,
        nom,
        prenom,
        role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
};

module.exports = exports;