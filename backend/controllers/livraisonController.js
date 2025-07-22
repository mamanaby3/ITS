const { Livraison, Commande, Client, CommandeDetail, Stock, Produit, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllLivraisons = async (req, res) => {
  try {
    const { magasin_id, statut, date_programmee, transporteur } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (statut) where.statut = statut;
    if (transporteur) where.transporteur = { [Op.like]: `%${transporteur}%` };
    if (date_programmee) {
      where.date_programmee = new Date(date_programmee);
    }

    const livraisons = await Livraison.findAll({
      where,
      include: [{
        model: Commande,
        as: 'commande',
        include: [
          { model: Client, as: 'client' },
          { model: CommandeDetail, as: 'details', include: ['produit'] }
        ]
      }],
      order: [['date_programmee', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({ success: true, data: livraisons });
  } catch (error) {
    console.error('Get livraisons error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des livraisons' 
    });
  }
};

exports.getLivraisonById = async (req, res) => {
  try {
    const livraison = await Livraison.findByPk(req.params.id, {
      include: [{
        model: Commande,
        as: 'commande',
        include: [
          { model: Client, as: 'client' },
          { model: CommandeDetail, as: 'details', include: ['produit'] }
        ]
      }]
    });

    if (!livraison) {
      return res.status(404).json({ 
        success: false, 
        error: 'Livraison non trouvée' 
      });
    }

    res.json({ success: true, data: livraison });
  } catch (error) {
    console.error('Get livraison error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la livraison' 
    });
  }
};

exports.createLivraison = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { commande_id, date_programmee, transporteur, vehicule, chauffeur, notes } = req.body;

    const commande = await Commande.findByPk(commande_id, { transaction: t });
    if (!commande) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Commande non trouvée' 
      });
    }

    if (!['confirmee', 'en_preparation', 'prete'].includes(commande.statut)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Cette commande ne peut pas être livrée dans son état actuel' 
      });
    }

    const existingLivraison = await Livraison.findOne({
      where: { commande_id, statut: { [Op.notIn]: ['annulee', 'retournee'] } },
      transaction: t
    });

    if (existingLivraison) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Une livraison existe déjà pour cette commande' 
      });
    }

    const numero = `LIV-${Date.now()}`;

    const livraison = await Livraison.create({
      numero,
      commande_id,
      magasin_id: commande.magasin_id,
      statut: 'programmee',
      date_programmee,
      transporteur,
      vehicule,
      chauffeur,
      notes,
      created_by: req.userId
    }, { transaction: t });

    await commande.update({ statut: 'en_livraison' }, { transaction: t });

    await t.commit();

    const createdLivraison = await Livraison.findByPk(livraison.id, {
      include: [{
        model: Commande,
        as: 'commande',
        include: ['client']
      }]
    });

    res.status(201).json({ success: true, data: createdLivraison });
  } catch (error) {
    await t.rollback();
    console.error('Create livraison error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de la livraison' 
    });
  }
};

exports.updateLivraisonStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { statut, notes } = req.body;
    const livraison = await Livraison.findByPk(req.params.id, {
      include: [{
        model: Commande,
        as: 'commande',
        include: [{
          model: CommandeDetail,
          as: 'details',
          include: ['produit']
        }]
      }],
      transaction: t
    });

    if (!livraison) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Livraison non trouvée' 
      });
    }

    const updateData = { statut };
    if (notes) updateData.notes = notes;

    if (statut === 'livree') {
      updateData.date_livraison = new Date();
      
      // Décrémenter le stock pour chaque produit livré
      if (livraison.commande && livraison.commande.details) {
        for (const detail of livraison.commande.details) {
          const stock = await Stock.findOne({
            where: {
              produit_id: detail.produit_id,
              magasin_id: livraison.magasin_id
            },
            transaction: t
          });

          if (stock) {
            const nouvelleQuantite = parseFloat(stock.quantite) - parseFloat(detail.quantite);
            const nouvelleQuantiteDisponible = parseFloat(stock.quantite_disponible) - parseFloat(detail.quantite);
            
            await stock.update({
              quantite: Math.max(0, nouvelleQuantite),
              quantite_disponible: Math.max(0, nouvelleQuantiteDisponible),
              derniere_sortie: new Date()
            }, { transaction: t });
          }
        }
      }
      
      await livraison.commande.update({ statut: 'livree' }, { transaction: t });
    }

    if (statut === 'retournee' || statut === 'incident') {
      await livraison.commande.update({ statut: 'confirmee' }, { transaction: t });
    }

    await livraison.update(updateData, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Statut de livraison mis à jour avec succès',
      data: { id: livraison.id, statut }
    });
  } catch (error) {
    await t.rollback();
    console.error('Update livraison status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du statut' 
    });
  }
};

exports.updateLivraison = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const livraison = await Livraison.findByPk(req.params.id);
    if (!livraison) {
      return res.status(404).json({ 
        success: false, 
        error: 'Livraison non trouvée' 
      });
    }

    if (livraison.statut === 'livree') {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de modifier une livraison terminée' 
      });
    }

    const { date_programmee, transporteur, vehicule, chauffeur, notes } = req.body;

    await livraison.update({
      date_programmee,
      transporteur,
      vehicule,
      chauffeur,
      notes
    });

    res.json({ success: true, data: livraison });
  } catch (error) {
    console.error('Update livraison error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour de la livraison' 
    });
  }
};

exports.cancelLivraison = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const livraison = await Livraison.findByPk(req.params.id, {
      include: ['commande'],
      transaction: t
    });

    if (!livraison) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Livraison non trouvée' 
      });
    }

    if (livraison.statut === 'livree') {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible d\'annuler une livraison terminée' 
      });
    }

    await livraison.update({ statut: 'annulee' }, { transaction: t });
    await livraison.commande.update({ statut: 'confirmee' }, { transaction: t });

    await t.commit();

    res.json({ 
      success: true, 
      message: 'Livraison annulée avec succès' 
    });
  } catch (error) {
    await t.rollback();
    console.error('Cancel livraison error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'annulation de la livraison' 
    });
  }
};

exports.getTodayLivraisons = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const livraisons = await Livraison.findAll({
      where: {
        date_programmee: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        statut: { [Op.notIn]: ['annulee', 'livree'] }
      },
      include: [{
        model: Commande,
        as: 'commande',
        include: ['client']
      }],
      order: [['date_programmee', 'ASC']]
    });

    res.json({ success: true, data: livraisons });
  } catch (error) {
    console.error('Get today livraisons error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des livraisons du jour' 
    });
  }
};

exports.createEntreeLivraison = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      client_id, 
      date_livraison, 
      transporteur, 
      vehicule, 
      chauffeur, 
      notes, 
      produits,
      magasin_id 
    } = req.body;

    // Validation des données
    if (!client_id || !date_livraison || !transporteur || !produits || !Array.isArray(produits)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes ou invalides' 
      });
    }

    // Vérifier le client
    const client = await Client.findByPk(client_id, { transaction: t });
    if (!client) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé' 
      });
    }

    // Créer la commande automatiquement
    const commande = await Commande.create({
      client_id,
      magasin_id,
      statut: 'confirmee',
      date_commande: new Date(),
      total: 0,
      created_by: req.userId
    }, { transaction: t });

    let totalCommande = 0;

    // Créer les détails de commande et mettre à jour le stock
    for (const produitData of produits) {
      const { produit_id, quantite, prix_unitaire } = produitData;
      
      if (!produit_id || !quantite || !prix_unitaire) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          error: 'Données produit manquantes' 
        });
      }

      // Vérifier que le produit existe
      const produit = await Produit.findByPk(produit_id, { transaction: t });
      if (!produit) {
        await t.rollback();
        return res.status(404).json({ 
          success: false, 
          error: `Produit avec ID ${produit_id} non trouvé` 
        });
      }

      // Créer le détail de commande
      await CommandeDetail.create({
        commande_id: commande.id,
        produit_id,
        quantite: parseFloat(quantite),
        prix_unitaire: parseFloat(prix_unitaire),
        sous_total: parseFloat(quantite) * parseFloat(prix_unitaire)
      }, { transaction: t });

      totalCommande += parseFloat(quantite) * parseFloat(prix_unitaire);

      // Mettre à jour ou créer le stock
      let stock = await Stock.findOne({
        where: {
          produit_id,
          magasin_id
        },
        transaction: t
      });

      if (stock) {
        // Incrémenter le stock existant
        await stock.update({
          quantite: parseFloat(stock.quantite) + parseFloat(quantite),
          quantite_disponible: parseFloat(stock.quantite_disponible) + parseFloat(quantite),
          valeur_unitaire: parseFloat(prix_unitaire),
          derniere_entree: new Date()
        }, { transaction: t });
      } else {
        // Créer un nouveau stock
        await Stock.create({
          produit_id,
          magasin_id,
          quantite: parseFloat(quantite),
          quantite_disponible: parseFloat(quantite),
          quantite_reservee: 0,
          valeur_unitaire: parseFloat(prix_unitaire),
          date_entree: new Date(),
          derniere_entree: new Date()
        }, { transaction: t });
      }
    }

    // Mettre à jour le total de la commande
    await commande.update({ total: totalCommande }, { transaction: t });

    // Créer la livraison
    const numero = `ENT-${Date.now()}`;
    const livraison = await Livraison.create({
      numero,
      commande_id: commande.id,
      magasin_id,
      statut: 'livree',
      date_programmee: new Date(date_livraison),
      date_livraison: new Date(date_livraison),
      transporteur,
      vehicule,
      chauffeur,
      notes,
      created_by: req.userId
    }, { transaction: t });

    await t.commit();

    // Récupérer la livraison complète
    const livraisonComplete = await Livraison.findByPk(livraison.id, {
      include: [{
        model: Commande,
        as: 'commande',
        include: [
          { model: Client, as: 'client' },
          { model: CommandeDetail, as: 'details', include: ['produit'] }
        ]
      }]
    });

    res.status(201).json({ 
      success: true, 
      message: 'Entrée de livraison créée avec succès',
      data: livraisonComplete 
    });
  } catch (error) {
    await t.rollback();
    console.error('Create entrée livraison error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'entrée de livraison' 
    });
  }
};