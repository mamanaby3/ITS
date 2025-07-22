const { Produit, Stock, Mouvement } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllProduits = async (req, res) => {
  try {
    const { categorie, actif, search } = req.query;
    const where = {};

    if (categorie) where.categorie = categorie;
    if (actif !== undefined) where.actif = actif === 'true';
    if (search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const produits = await Produit.findAll({
      where,
      include: [{
        model: Stock,
        as: 'stocks',
        required: false,
        where: req.user?.magasin_id ? { magasin_id: req.user.magasin_id } : {},
        attributes: ['quantite', 'quantite_reservee', 'magasin_id']
      }],
      order: [['nom', 'ASC']]
    });

    res.json({ success: true, data: produits });
  } catch (error) {
    console.error('Get produits error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des produits' 
    });
  }
};

exports.getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [{
        model: Stock,
        as: 'stocks',
        include: ['magasin']
      }]
    });

    if (!produit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }

    res.json({ success: true, data: produit });
  } catch (error) {
    console.error('Get produit error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du produit' 
    });
  }
};

exports.createProduit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reference, nom, description, categorie, unite, prix_unitaire, seuil_alerte } = req.body;

    const existingProduit = await Produit.findOne({ where: { reference } });
    if (existingProduit) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cette référence produit existe déjà' 
      });
    }

    const produit = await Produit.create({
      reference,
      nom,
      description,
      categorie,
      unite,
      prix_unitaire,
      seuil_alerte
    });

    res.status(201).json({ success: true, data: produit });
  } catch (error) {
    console.error('Create produit error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du produit' 
    });
  }
};

exports.updateProduit = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const produit = await Produit.findByPk(req.params.id);
    if (!produit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }

    const { reference, nom, description, categorie, unite, prix_unitaire, seuil_alerte, actif } = req.body;

    if (reference && reference !== produit.reference) {
      const existingProduit = await Produit.findOne({ 
        where: { reference, id: { [Op.ne]: produit.id } }
      });
      if (existingProduit) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cette référence produit existe déjà' 
        });
      }
    }

    await produit.update({
      reference,
      nom,
      description,
      categorie,
      unite,
      prix_unitaire,
      seuil_alerte,
      actif
    });

    res.json({ success: true, data: produit });
  } catch (error) {
    console.error('Update produit error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du produit' 
    });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produit non trouvé' 
      });
    }

    const stockCount = await Stock.count({ 
      where: { 
        produit_id: produit.id,
        quantite: { [Op.gt]: 0 }
      }
    });

    if (stockCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer un produit avec du stock existant' 
      });
    }

    await produit.update({ actif: false });

    res.json({ 
      success: true, 
      message: 'Produit désactivé avec succès' 
    });
  } catch (error) {
    console.error('Delete produit error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du produit' 
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Produit.findAll({
      attributes: [[Produit.sequelize.fn('DISTINCT', Produit.sequelize.col('categorie')), 'categorie']],
      where: { actif: true },
      raw: true
    });

    res.json({ 
      success: true, 
      data: categories.map(c => c.categorie).filter(Boolean) 
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des catégories' 
    });
  }
};