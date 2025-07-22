const bcrypt = require('bcryptjs');
const { User, Magasin } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const { magasin_id, role, actif } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (role) where.role = role;
    if (actif !== undefined) where.actif = actif === 'true';

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{
        model: Magasin,
        as: 'magasin',
        attributes: ['id', 'nom', 'ville']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des utilisateurs' 
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Magasin,
        as: 'magasin'
      }]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'utilisateur' 
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, nom, prenom, telephone, role, magasin_id, permissions } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cet email est déjà utilisé' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      nom,
      prenom,
      telephone,
      role,
      magasin_id,
      permissions
    });

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: ['magasin']
    });

    res.status(201).json({ success: true, data: createdUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'utilisateur' 
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const { email, nom, prenom, telephone, role, magasin_id, permissions, actif } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { email, id: { [Op.ne]: user.id } }
      });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cet email est déjà utilisé' 
        });
      }
    }

    await user.update({
      email,
      nom,
      prenom,
      telephone,
      role,
      magasin_id,
      permissions,
      actif
    });

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: ['magasin']
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour de l\'utilisateur' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ password: hashedPassword });

    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la réinitialisation du mot de passe' 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin', actif: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Impossible de supprimer le dernier administrateur actif' 
        });
      }
    }

    await user.update({ actif: false });

    res.json({ 
      success: true, 
      message: 'Utilisateur désactivé avec succès' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression de l\'utilisateur' 
    });
  }
};