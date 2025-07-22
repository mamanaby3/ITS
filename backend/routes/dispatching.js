const express = require('express');
const router = express.Router();
const { Dispatch, DispatchLivraison, User, Client, Produit, Magasin, Stock } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { sequelize } = require('../config/database');

// Créer un nouveau dispatch (Manager uniquement)
router.post('/create', authenticate, authorize('manager'), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      client_id,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      quantite_totale,
      quantite_client,
      quantite_stock,
      notes
    } = req.body;

    // Validation
    if (!client_id || !produit_id || !magasin_source_id || !magasin_destination_id || !quantite_totale) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Vérifier que les quantités sont cohérentes
    const totalCalcule = parseFloat(quantite_client || 0) + parseFloat(quantite_stock || 0);
    if (Math.abs(totalCalcule - parseFloat(quantite_totale)) > 0.01) {
      return res.status(400).json({ 
        error: 'La somme des quantités client et stock doit égaler la quantité totale' 
      });
    }

    // Vérifier le stock disponible
    const stock = await Stock.findOne({
      where: {
        produit_id,
        magasin_id: magasin_source_id
      }
    });

    if (!stock || stock.quantite < quantite_totale) {
      return res.status(400).json({ 
        error: 'Stock insuffisant dans le magasin source' 
      });
    }

    // Créer le dispatch
    const dispatch = await Dispatch.create({
      manager_id: req.user.id,
      client_id,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      quantite_totale,
      quantite_client: quantite_client || 0,
      quantite_stock: quantite_stock || 0,
      notes,
      statut: 'planifie'
    }, { transaction });

    // Mettre à jour le stock source (réserver la quantité)
    await stock.update({
      quantite: stock.quantite - quantite_totale,
      quantite_reservee: (stock.quantite_reservee || 0) + quantite_totale
    }, { transaction });

    await transaction.commit();

    // Récupérer le dispatch avec les associations
    const dispatchComplet = await Dispatch.findByPk(dispatch.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'prenom'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' }
      ]
    });

    res.json(dispatchComplet);
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création dispatch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lister les dispatches
router.get('/', authenticate, async (req, res) => {
  try {
    const { statut, magasin_id, date_debut, date_fin } = req.query;
    const where = {};

    if (statut) where.statut = statut;
    
    // Si c'est un opérateur, filtrer par ses magasins
    if (req.user.role === 'operator' && req.user.magasin_id) {
      where[sequelize.Op.or] = [
        { magasin_source_id: req.user.magasin_id },
        { magasin_destination_id: req.user.magasin_id }
      ];
    } else if (magasin_id) {
      where[sequelize.Op.or] = [
        { magasin_source_id: magasin_id },
        { magasin_destination_id: magasin_id }
      ];
    }

    if (date_debut && date_fin) {
      where.created_at = {
        [sequelize.Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    const dispatches = await Dispatch.findAll({
      where,
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'prenom'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' },
        { 
          model: DispatchLivraison, 
          as: 'livraisons',
          include: [
            { model: User, as: 'magasinier', attributes: ['id', 'nom', 'prenom'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(dispatches);
  } catch (error) {
    console.error('Erreur listing dispatches:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un dispatch spécifique
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dispatch = await Dispatch.findByPk(req.params.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'prenom'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' },
        { 
          model: DispatchLivraison, 
          as: 'livraisons',
          include: [
            { model: User, as: 'magasinier', attributes: ['id', 'nom', 'prenom'] }
          ]
        }
      ]
    });

    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch non trouvé' });
    }

    // Vérifier l'accès pour les opérateurs
    if (req.user.role === 'operator' && req.user.magasin_id) {
      if (dispatch.magasin_source_id !== req.user.magasin_id && 
          dispatch.magasin_destination_id !== req.user.magasin_id) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    res.json(dispatch);
  } catch (error) {
    console.error('Erreur récupération dispatch:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enregistrer une livraison (Magasinier/Opérateur)
router.post('/:id/livraison', authenticate, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const dispatch_id = req.params.id;
    const {
      type_livraison,
      quantite_livree,
      transporteur,
      numero_camion,
      chauffeur_nom,
      notes
    } = req.body;

    // Récupérer le dispatch
    const dispatch = await Dispatch.findByPk(dispatch_id);
    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch non trouvé' });
    }

    // Vérifier que l'utilisateur a accès au magasin destination
    if (req.user.role === 'operator' && req.user.magasin_id !== dispatch.magasin_destination_id) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez enregistrer des livraisons que pour votre magasin' 
      });
    }

    // Vérifier les quantités restantes
    const livraisonsExistantes = await DispatchLivraison.findAll({
      where: { 
        dispatch_id,
        statut: { [sequelize.Op.ne]: 'annulee' }
      }
    });

    const totalLivreClient = livraisonsExistantes
      .filter(l => l.type_livraison === 'client')
      .reduce((sum, l) => sum + parseFloat(l.quantite_livree), 0);
    
    const totalLivreStock = livraisonsExistantes
      .filter(l => l.type_livraison === 'stock')
      .reduce((sum, l) => sum + parseFloat(l.quantite_livree), 0);

    // Vérifier que la livraison ne dépasse pas les quantités prévues
    if (type_livraison === 'client' && 
        totalLivreClient + parseFloat(quantite_livree) > dispatch.quantite_client) {
      return res.status(400).json({ 
        error: `Quantité client dépassée. Restant: ${dispatch.quantite_client - totalLivreClient}T` 
      });
    }

    if (type_livraison === 'stock' && 
        totalLivreStock + parseFloat(quantite_livree) > dispatch.quantite_stock) {
      return res.status(400).json({ 
        error: `Quantité stock dépassée. Restant: ${dispatch.quantite_stock - totalLivreStock}T` 
      });
    }

    // Créer la livraison
    const livraison = await DispatchLivraison.create({
      dispatch_id,
      magasinier_id: req.user.id,
      type_livraison,
      quantite_livree,
      transporteur,
      numero_camion,
      chauffeur_nom,
      notes,
      statut: 'enregistree'
    }, { transaction });

    // Si c'est une livraison en stock, mettre à jour le stock du magasin destination
    if (type_livraison === 'stock') {
      const stock = await Stock.findOne({
        where: {
          produit_id: dispatch.produit_id,
          magasin_id: dispatch.magasin_destination_id
        },
        transaction
      });

      if (stock) {
        await stock.update({
          quantite: stock.quantite + parseFloat(quantite_livree)
        }, { transaction });
      } else {
        await Stock.create({
          produit_id: dispatch.produit_id,
          magasin_id: dispatch.magasin_destination_id,
          quantite: parseFloat(quantite_livree),
          seuil_min: 0,
          seuil_max: 1000000
        }, { transaction });
      }
    }

    // Vérifier si toutes les quantités ont été livrées
    const nouveauTotalClient = totalLivreClient + (type_livraison === 'client' ? parseFloat(quantite_livree) : 0);
    const nouveauTotalStock = totalLivreStock + (type_livraison === 'stock' ? parseFloat(quantite_livree) : 0);

    if (nouveauTotalClient >= dispatch.quantite_client && 
        nouveauTotalStock >= dispatch.quantite_stock) {
      // Toutes les quantités ont été livrées
      await dispatch.update({
        statut: 'complete',
        date_completion: new Date()
      }, { transaction });

      // Libérer la quantité réservée du stock source
      const stockSource = await Stock.findOne({
        where: {
          produit_id: dispatch.produit_id,
          magasin_id: dispatch.magasin_source_id
        },
        transaction
      });

      if (stockSource) {
        await stockSource.update({
          quantite_reservee: Math.max(0, (stockSource.quantite_reservee || 0) - dispatch.quantite_totale)
        }, { transaction });
      }
    } else {
      // Mettre à jour le statut en cours si nécessaire
      if (dispatch.statut === 'planifie') {
        await dispatch.update({ statut: 'en_cours' }, { transaction });
      }
    }

    await transaction.commit();

    // Récupérer la livraison complète
    const livraisonComplete = await DispatchLivraison.findByPk(livraison.id, {
      include: [
        { model: User, as: 'magasinier', attributes: ['id', 'nom', 'prenom'] },
        { 
          model: Dispatch, 
          as: 'dispatch',
          include: [
            { model: Produit, as: 'produit' },
            { model: Client, as: 'client' }
          ]
        }
      ]
    });

    res.json(livraisonComplete);
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur enregistrement livraison:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les statistiques de dispatch
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { magasin_id, date_debut, date_fin } = req.query;
    const where = {};

    if (req.user.role === 'operator' && req.user.magasin_id) {
      where[sequelize.Op.or] = [
        { magasin_source_id: req.user.magasin_id },
        { magasin_destination_id: req.user.magasin_id }
      ];
    } else if (magasin_id) {
      where[sequelize.Op.or] = [
        { magasin_source_id: magasin_id },
        { magasin_destination_id: magasin_id }
      ];
    }

    if (date_debut && date_fin) {
      where.created_at = {
        [sequelize.Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    // Statistiques par statut
    const stats = await Dispatch.findAll({
      where,
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('quantite_totale')), 'quantite_totale'],
        [sequelize.fn('SUM', sequelize.col('quantite_client')), 'quantite_client'],
        [sequelize.fn('SUM', sequelize.col('quantite_stock')), 'quantite_stock']
      ],
      group: ['statut']
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur statistiques dispatch:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;