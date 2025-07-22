const { Stock, Produit, Mouvement, Magasin, Client, User, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllStocks = async (req, res) => {
  try {
    const { categorie, low_stock, magasin_id } = req.query;

    const whereClause = {};
    const produitWhereClause = { actif: true };

    if (magasin_id) {
      whereClause.magasin_id = magasin_id;
    }

    if (categorie) {
      produitWhereClause.categorie = categorie;
    }

    const stocks = await Stock.findAll({
      where: whereClause,
      include: [
        {
          model: Produit,
          as: 'produit',
          where: produitWhereClause,
          required: true
        },
        {
          model: Magasin,
          as: 'magasin',
          required: true
        }
      ],
      order: [
        [{ model: Magasin, as: 'magasin' }, 'nom', 'ASC'],
        [{ model: Produit, as: 'produit' }, 'nom', 'ASC']
      ]
    });

    let filteredStocks = stocks;
    if (low_stock === 'true') {
      filteredStocks = stocks.filter(stock => 
        stock.quantite <= stock.produit.seuil_alerte
      );
    }

    res.json({ success: true, data: filteredStocks });
  } catch (error) {
    console.error('Get all stocks error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des stocks' 
    });
  }
};

exports.getStockByMagasin = async (req, res) => {
  try {
    const { magasin_id } = req.params;
    const { categorie, low_stock } = req.query;

    const whereClause = { magasin_id };
    const produitWhereClause = { actif: true };

    if (categorie) {
      produitWhereClause.categorie = categorie;
    }

    const stocks = await Stock.findAll({
      where: whereClause,
      include: [{
        model: Produit,
        as: 'produit',
        where: produitWhereClause,
        required: true
      }],
      order: [[{ model: Produit, as: 'produit' }, 'nom', 'ASC']]
    });

    let filteredStocks = stocks;
    if (low_stock === 'true') {
      filteredStocks = stocks.filter(stock => 
        stock.quantite <= stock.produit.seuil_alerte
      );
    }

    res.json({ success: true, data: filteredStocks });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du stock' 
    });
  }
};

exports.addStock = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      produit_id, 
      magasin_id, 
      quantite, 
      lot_number, 
      date_expiration, 
      emplacement, 
      fournisseur,
      fournisseur_id,
      client_id,
      numero_bl,
      date_livraison,
      transporteur,
      nom_chauffeur,
      telephone_chauffeur,
      numero_camion,
      prix_unitaire,
      observations,
      type_livraison
    } = req.body;

    let stock = await Stock.findOne({
      where: { produit_id, magasin_id, lot_number: lot_number || null },
      transaction: t
    });

    if (stock) {
      await stock.increment('quantite', { by: quantite, transaction: t });
      await stock.update({
        derniere_entree: new Date(),
        date_expiration: date_expiration || stock.date_expiration
      }, { transaction: t });
    } else {
      stock = await Stock.create({
        produit_id,
        magasin_id,
        quantite,
        quantite_disponible: quantite,
        lot_number,
        date_entree: new Date(),
        derniere_entree: new Date(),
        date_expiration,
        emplacement,
        valeur_unitaire: prix_unitaire || 0
      }, { transaction: t });
    }

    await Mouvement.create({
      type: 'entree',
      produit_id,
      magasin_id,
      quantite,
      reference: numero_bl || `ENT-${Date.now()}`,
      lot_number,
      fournisseur: fournisseur || (fournisseur_id ? `Fournisseur ${fournisseur_id}` : null),
      fournisseur_id,
      client_id,
      numero_bl,
      date_livraison: date_livraison || new Date(),
      transporteur,
      nom_chauffeur,
      telephone_chauffeur,
      numero_camion,
      date_expiration,
      prix_unitaire,
      observations,
      type_livraison,
      raison: 'Réception de livraison',
      created_by: req.userId
    }, { transaction: t });

    await t.commit();

    const updatedStock = await Stock.findByPk(stock.id, {
      include: ['produit', 'magasin']
    });

    res.status(201).json({ success: true, data: updatedStock });
  } catch (error) {
    await t.rollback();
    console.error('Add stock error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'ajout du stock' 
    });
  }
};

exports.removeStock = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { produit_id, magasin_id, quantite, lot_number, raison } = req.body;

    const stock = await Stock.findOne({
      where: { produit_id, magasin_id, lot_number: lot_number || null },
      transaction: t
    });

    if (!stock) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Stock non trouvé' 
      });
    }

    const disponible = stock.quantite - stock.quantite_reservee;
    if (quantite > disponible) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: `Quantité insuffisante. Disponible: ${disponible}` 
      });
    }

    await stock.decrement('quantite', { by: quantite, transaction: t });

    await Mouvement.create({
      type: 'sortie',
      produit_id,
      magasin_id,
      quantite,
      reference: `SOR-${Date.now()}`,
      lot_number,
      raison,
      created_by: req.userId
    }, { transaction: t });

    await t.commit();

    const updatedStock = await Stock.findByPk(stock.id, {
      include: ['produit', 'magasin']
    });

    res.json({ success: true, data: updatedStock });
  } catch (error) {
    await t.rollback();
    console.error('Remove stock error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la sortie de stock' 
    });
  }
};

exports.transferStock = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { produit_id, magasin_source_id, magasin_destination_id, quantite, lot_number } = req.body;

    if (magasin_source_id === magasin_destination_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Les magasins source et destination doivent être différents' 
      });
    }

    const stockSource = await Stock.findOne({
      where: { produit_id, magasin_id: magasin_source_id, lot_number: lot_number || null },
      transaction: t
    });

    if (!stockSource) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Stock source non trouvé' 
      });
    }

    const disponible = stockSource.quantite - stockSource.quantite_reservee;
    if (quantite > disponible) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: `Quantité insuffisante. Disponible: ${disponible}` 
      });
    }

    await stockSource.decrement('quantite', { by: quantite, transaction: t });

    let stockDestination = await Stock.findOne({
      where: { produit_id, magasin_id: magasin_destination_id, lot_number: lot_number || null },
      transaction: t
    });

    if (stockDestination) {
      await stockDestination.increment('quantite', { by: quantite, transaction: t });
    } else {
      stockDestination = await Stock.create({
        produit_id,
        magasin_id: magasin_destination_id,
        quantite,
        lot_number,
        date_entree: new Date(),
        date_expiration: stockSource.date_expiration,
        emplacement: null
      }, { transaction: t });
    }

    const reference = `TRF-${Date.now()}`;
    await Mouvement.create({
      type: 'transfert',
      produit_id,
      magasin_id: magasin_source_id,
      magasin_destination_id,
      quantite,
      reference,
      lot_number,
      raison: 'Transfert entre magasins',
      created_by: req.userId
    }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Transfert effectué avec succès',
      data: { reference }
    });
  } catch (error) {
    await t.rollback();
    console.error('Transfer stock error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du transfert de stock' 
    });
  }
};

exports.adjustStock = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { produit_id, magasin_id, nouvelle_quantite, lot_number, raison } = req.body;

    const stock = await Stock.findOne({
      where: { produit_id, magasin_id, lot_number: lot_number || null },
      transaction: t
    });

    if (!stock) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Stock non trouvé' 
      });
    }

    const difference = nouvelle_quantite - stock.quantite;
    if (difference === 0) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Aucun ajustement nécessaire' 
      });
    }

    await stock.update({ quantite: nouvelle_quantite }, { transaction: t });

    await Mouvement.create({
      type: 'ajustement',
      produit_id,
      magasin_id,
      quantite: Math.abs(difference),
      reference: `ADJ-${Date.now()}`,
      lot_number,
      raison: `${raison} (${difference > 0 ? '+' : ''}${difference})`,
      created_by: req.userId
    }, { transaction: t });

    await t.commit();

    const updatedStock = await Stock.findByPk(stock.id, {
      include: ['produit', 'magasin']
    });

    res.json({ success: true, data: updatedStock });
  } catch (error) {
    await t.rollback();
    console.error('Adjust stock error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'ajustement du stock' 
    });
  }
};

exports.getStockMovements = async (req, res) => {
  try {
    const { magasin_id, produit_id, type, start_date, end_date } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (produit_id) where.produit_id = produit_id;
    if (type) where.type = type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const movements = await Mouvement.findAll({
      where,
      include: [
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin' },
        { model: Magasin, as: 'magasin_destination' },
        { model: Client, as: 'client' },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    res.json({ success: true, data: movements });
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des mouvements' 
    });
  }
};

exports.getEntreesJour = async (req, res) => {
  try {
    const { magasin_id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movements = await Mouvement.findAll({
      where: {
        type: 'entree',
        magasin_id,
        created_at: {
          [Op.gte]: today
        }
      },
      include: [
        { model: Produit, as: 'produit' },
        { model: Client, as: 'client' },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: movements });
  } catch (error) {
    console.error('Get entrées jour error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des entrées du jour' 
    });
  }
};