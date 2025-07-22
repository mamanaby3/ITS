const { Stock, Produit, Mouvement, Commande, Client, Magasin, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getStockReport = async (req, res) => {
  try {
    const { magasin_id } = req.query;
    const where = {};
    if (magasin_id) where.magasin_id = magasin_id;

    const stocks = await Stock.findAll({
      where,
      include: [{
        model: Produit,
        as: 'produit',
        where: { actif: true }
      }, {
        model: Magasin,
        as: 'magasin'
      }],
      order: [[{ model: Produit, as: 'produit' }, 'categorie', 'ASC'], [{ model: Produit, as: 'produit' }, 'nom', 'ASC']]
    });

    const report = stocks.map(stock => ({
      produit_reference: stock.produit.reference,
      produit_nom: stock.produit.nom,
      categorie: stock.produit.categorie,
      unite: stock.produit.unite,
      magasin: stock.magasin.nom,
      quantite_disponible: stock.quantite - stock.quantite_reservee,
      quantite_reservee: stock.quantite_reservee,
      quantite_totale: stock.quantite,
      valeur_stock: stock.quantite * stock.produit.prix_unitaire,
      seuil_alerte: stock.produit.seuil_alerte,
      statut: stock.quantite <= stock.produit.seuil_alerte ? 'Alerte' : 'Normal'
    }));

    const summary = {
      total_produits: report.length,
      valeur_totale: report.reduce((sum, item) => sum + item.valeur_stock, 0),
      produits_en_alerte: report.filter(item => item.statut === 'Alerte').length
    };

    res.json({ 
      success: true, 
      data: {
        report,
        summary,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport de stock' 
    });
  }
};

exports.getMovementReport = async (req, res) => {
  try {
    const { magasin_id, start_date, end_date, type, produit_id } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (type) where.type = type;
    if (produit_id) where.produit_id = produit_id;
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
        { model: Magasin, as: 'magasin_destination' }
      ],
      order: [['created_at', 'DESC']]
    });

    const summary = {
      total_movements: movements.length,
      by_type: {}
    };

    const types = ['entree', 'sortie', 'transfert', 'ajustement', 'perte', 'retour'];
    types.forEach(type => {
      const typeMovements = movements.filter(m => m.type === type);
      summary.by_type[type] = {
        count: typeMovements.length,
        total_quantity: typeMovements.reduce((sum, m) => sum + parseFloat(m.quantite), 0)
      };
    });

    res.json({ 
      success: true, 
      data: {
        movements,
        summary,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Get movement report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport des mouvements' 
    });
  }
};

exports.getEntreesReport = async (req, res) => {
  try {
    const { magasin_id, start_date, end_date, client_id } = req.query;
    const where = { statut: 'livree' };

    if (magasin_id) where.magasin_id = magasin_id;
    if (client_id) where.client_id = client_id;
    if (start_date || end_date) {
      where.date_commande = {};
      if (start_date) where.date_commande[Op.gte] = new Date(start_date);
      if (end_date) where.date_commande[Op.lte] = new Date(end_date);
    }

    const commandes = await Commande.findAll({
      where,
      include: [
        { model: Client, as: 'client' },
        { 
          model: CommandeDetail, 
          as: 'details',
          include: ['produit']
        }
      ],
      order: [['date_commande', 'DESC']]
    });

    const entreesByProduct = {};
    const entreesByClient = {};
    const entreesByCategory = {};

    commandes.forEach(commande => {
      commande.details.forEach(detail => {
        const produitKey = detail.produit.reference;
        if (!entreesByProduct[produitKey]) {
          entreesByProduct[produitKey] = {
            reference: detail.produit.reference,
            nom: detail.produit.nom,
            categorie: detail.produit.categorie,
            quantite_entree: 0,
            montant_total: 0
          };
        }
        entreesByProduct[produitKey].quantite_entree += parseFloat(detail.quantite);
        entreesByProduct[produitKey].montant_total += parseFloat(detail.total);

        const categoryKey = detail.produit.categorie;
        if (!entreesByCategory[categoryKey]) {
          entreesByCategory[categoryKey] = {
            categorie: categoryKey,
            montant_total: 0
          };
        }
        entreesByCategory[categoryKey].montant_total += parseFloat(detail.total);
      });

      const clientKey = commande.client.code;
      if (!entreesByClient[clientKey]) {
        entreesByClient[clientKey] = {
          code: commande.client.code,
          nom: commande.client.nom,
          nombre_commandes: 0,
          montant_total: 0
        };
      }
      entreesByClient[clientKey].nombre_commandes += 1;
      entreesByClient[clientKey].montant_total += parseFloat(commande.total_ttc);
    });

    const summary = {
      total_commandes: commandes.length,
      montant_total_ht: commandes.reduce((sum, c) => sum + parseFloat(c.total_ht), 0),
      montant_total_ttc: commandes.reduce((sum, c) => sum + parseFloat(c.total_ttc), 0),
      top_produits: Object.values(entreesByProduct)
        .sort((a, b) => b.montant_total - a.montant_total)
        .slice(0, 10),
      top_clients: Object.values(entreesByClient)
        .sort((a, b) => b.montant_total - a.montant_total)
        .slice(0, 10),
      entrees_par_categorie: Object.values(entreesByCategory)
    };

    res.json({ 
      success: true, 
      data: {
        commandes: commandes.map(c => ({
          numero: c.numero,
          date: c.date_commande,
          client: c.client.nom,
          montant_ht: c.total_ht,
          montant_ttc: c.total_ttc
        })),
        summary,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Get entrees report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport des entrées' 
    });
  }
};

exports.getInventoryValuation = async (req, res) => {
  try {
    const { magasin_id } = req.query;
    const where = {};
    if (magasin_id) where.magasin_id = magasin_id;

    const stocks = await Stock.findAll({
      where,
      include: [{
        model: Produit,
        as: 'produit',
        where: { actif: true }
      }, {
        model: Magasin,
        as: 'magasin'
      }]
    });

    const valuation = {};
    let totalValue = 0;

    stocks.forEach(stock => {
      const category = stock.produit.categorie;
      if (!valuation[category]) {
        valuation[category] = {
          categorie: category,
          nombre_produits: 0,
          quantite_totale: 0,
          valeur_totale: 0
        };
      }

      const value = stock.quantite * stock.produit.prix_unitaire;
      valuation[category].nombre_produits += 1;
      valuation[category].quantite_totale += parseFloat(stock.quantite);
      valuation[category].valeur_totale += value;
      totalValue += value;
    });

    res.json({ 
      success: true, 
      data: {
        valuation_by_category: Object.values(valuation),
        total_value: totalValue,
        total_products: stocks.length,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Get inventory valuation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération de la valorisation du stock' 
    });
  }
};

exports.getActivityReport = async (req, res) => {
  try {
    const { start_date, end_date, magasin_id } = req.query;
    const where = {};
    const mouvementWhere = {};

    if (magasin_id) {
      where.magasin_id = magasin_id;
      mouvementWhere.magasin_id = magasin_id;
    }

    if (start_date || end_date) {
      const dateFilter = {};
      if (start_date) dateFilter[Op.gte] = new Date(start_date);
      if (end_date) dateFilter[Op.lte] = new Date(end_date);
      
      where.created_at = dateFilter;
      mouvementWhere.created_at = dateFilter;
    }

    const [commandes, mouvements, newClients] = await Promise.all([
      Commande.count({ where }),
      Mouvement.count({ where: mouvementWhere }),
      Client.count({ where: { created_at: where.created_at || {} } })
    ]);

    const commandesByStatus = await Commande.findAll({
      where,
      attributes: [
        'statut',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['statut']
    });

    const mouvementsByType = await Mouvement.findAll({
      where: mouvementWhere,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    res.json({ 
      success: true, 
      data: {
        summary: {
          total_commandes: commandes,
          total_mouvements: mouvements,
          nouveaux_clients: newClients
        },
        commandes_by_status: commandesByStatus,
        mouvements_by_type: mouvementsByType,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Get activity report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la génération du rapport d\'activité' 
    });
  }
};