const { Client, Commande } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAllClients = async (req, res) => {
  try {
    const { magasin_id, type_client, actif, search } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (type_client) where.type_client = type_client;
    if (actif !== undefined) where.actif = actif === 'true';
    if (search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } }
      ];
    }

    const clients = await Client.findAll({
      where,
      include: [{
        model: Commande,
        as: 'commandes',
        attributes: ['id', 'numero', 'total_ttc', 'statut'],
        required: false
      }],
      order: [['nom', 'ASC']]
    });

    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des clients' 
    });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: Commande,
        as: 'commandes',
        include: ['produits'],
        order: [['created_at', 'DESC']],
        limit: 10
      }]
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé' 
      });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération du client' 
    });
  }
};

exports.createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { code, nom, email, telephone, adresse, ville, type_client, credit_limit, magasin_id } = req.body;

    const existingClient = await Client.findOne({ where: { code } });
    if (existingClient) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ce code client existe déjà' 
      });
    }

    const client = await Client.create({
      code,
      nom,
      email,
      telephone,
      adresse,
      ville,
      type_client,
      credit_limit,
      magasin_id
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du client' 
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé' 
      });
    }

    const { code, nom, email, telephone, adresse, ville, type_client, credit_limit, actif } = req.body;

    if (code && code !== client.code) {
      const existingClient = await Client.findOne({ 
        where: { code, id: { [Op.ne]: client.id } }
      });
      if (existingClient) {
        return res.status(400).json({ 
          success: false, 
          error: 'Ce code client existe déjà' 
        });
      }
    }

    await client.update({
      code,
      nom,
      email,
      telephone,
      adresse,
      ville,
      type_client,
      credit_limit,
      actif
    });

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour du client' 
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Client non trouvé' 
      });
    }

    const commandeCount = await Commande.count({ 
      where: { 
        client_id: client.id,
        statut: { [Op.notIn]: ['annulee', 'livree'] }
      }
    });

    if (commandeCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Impossible de supprimer un client avec des commandes actives' 
      });
    }

    await client.update({ actif: false });

    res.json({ 
      success: true, 
      message: 'Client désactivé avec succès' 
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression du client' 
    });
  }
};

exports.getClientStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const totalCommandes = await Commande.count({ where: { client_id: id } });
    const commandesEnCours = await Commande.count({ 
      where: { 
        client_id: id, 
        statut: { [Op.notIn]: ['annulee', 'livree'] }
      }
    });
    
    const montantTotal = await Commande.sum('total_ttc', { 
      where: { 
        client_id: id,
        statut: 'livree'
      }
    }) || 0;

    const client = await Client.findByPk(id, {
      attributes: ['credit_limit', 'credit_utilise']
    });

    res.json({ 
      success: true, 
      data: {
        totalCommandes,
        commandesEnCours,
        montantTotal,
        creditLimit: client.credit_limit,
        creditUtilise: client.credit_utilise,
        creditDisponible: client.credit_limit - client.credit_utilise
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
};