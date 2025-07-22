const express = require('express');
const router = express.Router();
const { Magasin, Stock, Produit, Mouvement, Dispatch, DispatchLivraison, sequelize } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// Obtenir les stocks par magasin avec totaux
router.get('/stocks-magasins', authenticate, async (req, res) => {
  try {
    // Récupérer tous les magasins avec leur stock total
    const magasins = await Magasin.findAll({
      attributes: [
        'id',
        'nom',
        'code',
        'localisation',
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(quantite), 0)
            FROM stocks
            WHERE stocks.magasin_id = Magasin.id
          )`),
          'stock_total'
        ]
      ],
      order: [['nom', 'ASC']]
    });

    res.json(magasins);
  } catch (error) {
    console.error('Erreur récupération stocks magasins:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les statistiques de tonnage
router.get('/stats-tonnage', authenticate, async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;
    const where = {};
    
    if (date_debut && date_fin) {
      where.created_at = {
        [Op.between]: [new Date(date_debut), new Date(date_fin + ' 23:59:59')]
      };
    }

    // Compter les dispatches
    const totalDispatches = await Dispatch.count({ where });

    // Calculer les totaux des mouvements
    const mouvementsStats = await Mouvement.findAll({
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('quantite')), 'total']
      ],
      where: date_debut && date_fin ? {
        date_mouvement: {
          [Op.between]: [new Date(date_debut), new Date(date_fin + ' 23:59:59')]
        }
      } : {},
      group: ['type']
    });

    const stats = {
      total_dispatches: totalDispatches,
      total_entrees: 0,
      total_sorties: 0
    };

    mouvementsStats.forEach(stat => {
      if (stat.type === 'entree') {
        stats.total_entrees = parseFloat(stat.dataValues.total);
      } else if (stat.type === 'sortie') {
        stats.total_sorties = parseFloat(stat.dataValues.total);
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur statistiques tonnage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir l'évolution du stock par magasin
router.get('/evolution-stock/:magasinId', authenticate, async (req, res) => {
  try {
    const { magasinId } = req.params;
    const { date_debut, date_fin } = req.query;

    // Récupérer tous les mouvements du magasin
    const mouvements = await Mouvement.findAll({
      where: {
        [Op.or]: [
          { magasin_id: magasinId },
          { magasin_destination_id: magasinId }
        ],
        date_mouvement: {
          [Op.between]: [new Date(date_debut), new Date(date_fin + ' 23:59:59')]
        }
      },
      include: [
        { model: Produit, as: 'produit', attributes: ['nom', 'code'] }
      ],
      order: [['date_mouvement', 'DESC']]
    });

    // Calculer l'évolution jour par jour
    const evolution = {};
    const dateRange = [];
    let currentDate = new Date(date_debut);
    const endDate = new Date(date_fin);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateRange.push(dateStr);
      evolution[dateStr] = {
        date: dateStr,
        entrees: 0,
        sorties: 0,
        stock_fin_journee: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculer les mouvements par jour
    mouvements.forEach(mouvement => {
      const dateStr = mouvement.date_mouvement.toISOString().split('T')[0];
      if (evolution[dateStr]) {
        if (mouvement.type === 'entree' || mouvement.magasin_destination_id === magasinId) {
          evolution[dateStr].entrees += parseFloat(mouvement.quantite);
        } else if (mouvement.type === 'sortie' && mouvement.magasin_id === magasinId) {
          evolution[dateStr].sorties += parseFloat(mouvement.quantite);
        }
      }
    });

    // Obtenir le stock initial
    const stockActuel = await Stock.sum('quantite', {
      where: { magasin_id: magasinId }
    }) || 0;

    // Calculer le stock de fin de journée
    let stockCumule = stockActuel;
    // Parcourir en ordre inverse pour calculer depuis le stock actuel
    dateRange.reverse().forEach(dateStr => {
      evolution[dateStr].stock_fin_journee = stockCumule;
      stockCumule = stockCumule - evolution[dateStr].entrees + evolution[dateStr].sorties;
    });

    res.json({
      magasin_id: magasinId,
      evolution: dateRange.reverse().map(date => evolution[date]),
      stock_actuel: stockActuel
    });
  } catch (error) {
    console.error('Erreur évolution stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le détail des mouvements récents
router.get('/mouvements-recents', authenticate, async (req, res) => {
  try {
    const { magasin_id, limit = 10 } = req.query;
    const where = {};

    if (magasin_id) {
      where[Op.or] = [
        { magasin_id },
        { magasin_destination_id: magasin_id }
      ];
    }

    const mouvements = await Mouvement.findAll({
      where,
      include: [
        { model: Produit, as: 'produit', attributes: ['nom', 'code'] },
        { model: Magasin, as: 'magasin', attributes: ['nom', 'code'] },
        { model: Magasin, as: 'magasin_destination', attributes: ['nom', 'code'] }
      ],
      order: [['date_mouvement', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(mouvements);
  } catch (error) {
    console.error('Erreur mouvements récents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les alertes de stock
router.get('/alertes-stock', authenticate, async (req, res) => {
  try {
    // Récupérer les stocks en alerte (sous le seuil minimum)
    const stocksEnAlerte = await Stock.findAll({
      where: {
        [Op.or]: [
          sequelize.where(
            sequelize.col('quantite'),
            '<=',
            sequelize.col('seuil_min')
          ),
          {
            quantite: {
              [Op.lte]: 100 // Alerte si moins de 100 tonnes
            }
          }
        ]
      },
      include: [
        { model: Produit, as: 'produit', attributes: ['nom', 'code'] },
        { model: Magasin, as: 'magasin', attributes: ['nom', 'code'] }
      ]
    });

    res.json(stocksEnAlerte);
  } catch (error) {
    console.error('Erreur alertes stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les statistiques d'un magasin spécifique
router.get('/stats-magasin/:magasinId', authenticate, async (req, res) => {
  try {
    const { magasinId } = req.params;
    const { date_debut, date_fin } = req.query;

    // Vérifier l'accès au magasin pour les operators
    if (req.user.role === 'operator' && req.user.magasin_id !== magasinId) {
      return res.status(403).json({ error: 'Accès refusé à ce magasin' });
    }

    // Récupérer tous les mouvements du magasin
    const mouvements = await Mouvement.findAll({
      where: {
        [Op.or]: [
          { magasin_id: magasinId },
          { magasin_destination_id: magasinId }
        ],
        date_mouvement: date_debut && date_fin ? {
          [Op.between]: [new Date(date_debut), new Date(date_fin + ' 23:59:59')]
        } : {}
      },
      include: [
        { model: Produit, as: 'produit', attributes: ['nom', 'code'] }
      ]
    });

    // Calculer les statistiques
    let totalEntrees = 0;
    let totalSorties = 0;
    let nombreEntrees = 0;
    let nombreSorties = 0;

    mouvements.forEach(mouvement => {
      const quantite = parseFloat(mouvement.quantite);
      
      // Entrées : mouvements d'entrée ou dispatching vers ce magasin
      if (mouvement.type === 'entree' || 
          (mouvement.type === 'dispatching' && mouvement.magasin_destination_id === magasinId)) {
        totalEntrees += quantite;
        nombreEntrees++;
      }
      // Sorties : mouvements de sortie depuis ce magasin
      else if (mouvement.type === 'sortie' && mouvement.magasin_id === magasinId) {
        totalSorties += quantite;
        nombreSorties++;
      }
    });

    // Stock actuel
    const stockActuel = await Stock.sum('quantite', {
      where: { magasin_id: magasinId }
    }) || 0;

    // Taux de rotation
    const tauxRotation = totalEntrees > 0 ? (totalSorties / totalEntrees) * 100 : 0;

    res.json({
      magasin_id: magasinId,
      total_entrees: totalEntrees,
      total_sorties: totalSorties,
      stock_actuel: stockActuel,
      taux_rotation: tauxRotation,
      nombre_entrees: nombreEntrees,
      nombre_sorties: nombreSorties,
      periode: {
        debut: date_debut || 'Non spécifiée',
        fin: date_fin || 'Non spécifiée'
      }
    });

  } catch (error) {
    console.error('Erreur stats magasin:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;