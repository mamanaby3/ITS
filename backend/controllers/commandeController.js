const { Commande, CommandeDetail, Client, Produit, Stock, Mouvement, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllCommandes = async (req, res) => {
  try {
    const { magasin_id, client_id, statut, start_date, end_date } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (client_id) where.client_id = client_id;
    if (statut) where.statut = statut;
    if (start_date || end_date) {
      where.date_commande = {};
      if (start_date) where.date_commande[Op.gte] = new Date(start_date);
      if (end_date) where.date_commande[Op.lte] = new Date(end_date);
    }

    const commandes = await Commande.findAll({
      where,
      include: [
        { model: Client, as: 'client' },
        { model: CommandeDetail, as: 'details', include: ['produit'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: commandes });
  } catch (error) {
    console.error('Get commandes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des commandes' 
    });
  }
};

exports.getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: CommandeDetail, as: 'details', include: ['produit'] },
        { model: User, as: 'createur', attributes: ['nom', 'prenom'] }
      ]
    });

    if (!commande) {
      return res.status(404).json({ 
        success: false, 
        error: 'Commande non trouvée' 
      });
    }

    res.json({ success: true, data: commande });
  } catch (error) {
    console.error('Get commande error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la commande' 
    });
  }
};

exports.createCommande = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { client_id, magasin_id, date_livraison_prevue, notes, details } = req.body;

    const numero = `CMD-${Date.now()}`;
    let total_ht = 0;
    let total_ttc = 0;

    const commande = await Commande.create({
      numero,
      client_id,
      magasin_id,
      statut: 'confirmee',
      date_commande: new Date(),
      date_livraison_prevue,
      notes,
      created_by: req.userId,
      total_ht: 0,
      total_ttc: 0
    }, { transaction: t });

    for (const detail of details) {
      const produit = await Produit.findByPk(detail.produit_id, { transaction: t });
      if (!produit) {
        await t.rollback();
        return res.status(404).json({ 
          success: false, 
          error: `Produit ${detail.produit_id} non trouvé` 
        });
      }

      const stock = await Stock.findOne({
        where: { produit_id: detail.produit_id, magasin_id },
        transaction: t
      });

      if (!stock || stock.quantite - stock.quantite_reservee < detail.quantite) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          error: `Stock insuffisant pour ${produit.nom}` 
        });
      }

      await stock.increment('quantite_reservee', { by: detail.quantite, transaction: t });

      const total = detail.quantite * produit.prix_unitaire;
      total_ht += total;

      await CommandeDetail.create({
        commande_id: commande.id,
        produit_id: detail.produit_id,
        quantite: detail.quantite,
        prix_unitaire: produit.prix_unitaire,
        total
      }, { transaction: t });
    }

    total_ttc = total_ht * 1.18; // TVA 18%

    await commande.update({ total_ht, total_ttc }, { transaction: t });

    await t.commit();

    const createdCommande = await Commande.findByPk(commande.id, {
      include: [
        { model: Client, as: 'client' },
        { model: CommandeDetail, as: 'details', include: ['produit'] }
      ]
    });

    res.status(201).json({ success: true, data: createdCommande });
  } catch (error) {
    await t.rollback();
    console.error('Create commande error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la commande' 
    });
  }
};

exports.updateCommandeStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { statut } = req.body;
    const commande = await Commande.findByPk(req.params.id, {
      include: ['details'],
      transaction: t
    });

    if (!commande) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Commande non trouvée' 
      });
    }

    const oldStatut = commande.statut;

    if (statut === 'annulee' && oldStatut !== 'livree') {
      for (const detail of commande.details) {
        const stock = await Stock.findOne({
          where: { produit_id: detail.produit_id, magasin_id: commande.magasin_id },
          transaction: t
        });
        if (stock) {
          await stock.decrement('quantite_reservee', { by: detail.quantite, transaction: t });
        }
      }
    }

    if (statut === 'livree' && oldStatut !== 'livree') {
      for (const detail of commande.details) {
        const stock = await Stock.findOne({
          where: { produit_id: detail.produit_id, magasin_id: commande.magasin_id },
          transaction: t
        });
        if (stock) {
          await stock.decrement('quantite', { by: detail.quantite, transaction: t });
          await stock.decrement('quantite_reservee', { by: detail.quantite, transaction: t });

          await Mouvement.create({
            type: 'sortie',
            produit_id: detail.produit_id,
            magasin_id: commande.magasin_id,
            quantite: detail.quantite,
            reference: commande.numero,
            commande_id: commande.id,
            raison: 'Livraison commande',
            created_by: req.userId
          }, { transaction: t });
        }
      }
    }

    await commande.update({ statut }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Statut mis à jour avec succès',
      data: { id: commande.id, statut }
    });
  } catch (error) {
    await t.rollback();
    console.error('Update commande status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
};

exports.deleteCommande = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: ['details'],
      transaction: t
    });

    if (!commande) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Commande non trouvée' 
      });
    }

    if (commande.statut === 'livree') {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer une commande livrée' 
      });
    }

    if (commande.statut !== 'annulee') {
      for (const detail of commande.details) {
        const stock = await Stock.findOne({
          where: { produit_id: detail.produit_id, magasin_id: commande.magasin_id },
          transaction: t
        });
        if (stock) {
          await stock.decrement('quantite_reservee', { by: detail.quantite, transaction: t });
        }
      }
    }

    await commande.update({ statut: 'annulee' }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Commande annulée avec succès' 
    });
  } catch (error) {
    await t.rollback();
    console.error('Delete commande error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'annulation de la commande' 
    });
  }
};