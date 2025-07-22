const { Dispatch, Rotation, User, Client, Produit, Magasin, Stock, Chauffeur, Mouvement } = require('../models');
const { Op } = require('sequelize');

// Générer un numéro de dispatch unique
const generateDispatchNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DISP-${date}-${random}`;
};

// Générer un numéro de rotation unique
const generateRotationNumber = (dispatchNumber, index) => {
  return `${dispatchNumber}-R${String(index).padStart(3, '0')}`;
};

// Créer un nouveau dispatch
exports.createDispatch = async (req, res) => {
  try {
    const { client_id, produit_id, magasin_source_id, magasin_destination_id, quantite_totale, notes } = req.body;
    const manager_id = req.user.id;

    // Vérifier le stock disponible
    const stock = await Stock.findOne({
      where: {
        produit_id,
        magasin_id: magasin_source_id
      }
    });

    if (!stock || stock.quantite < quantite_totale) {
      return res.status(400).json({ 
        message: 'Stock insuffisant pour cette opération',
        stockDisponible: stock ? stock.quantite : 0,
        quantiteDemandee: quantite_totale
      });
    }

    // Créer le dispatch
    const dispatch = await Dispatch.create({
      numero_dispatch: generateDispatchNumber(),
      manager_id,
      client_id,
      produit_id,
      magasin_source_id,
      magasin_destination_id,
      quantite_totale,
      notes,
      statut: 'en_attente'
    });

    // Récupérer le dispatch avec les associations
    const dispatchComplet = await Dispatch.findByPk(dispatch.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'email'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' }
      ]
    });

    res.status(201).json({
      message: 'Dispatch créé avec succès',
      dispatch: dispatchComplet
    });
  } catch (error) {
    console.error('Erreur création dispatch:', error);
    res.status(500).json({ message: 'Erreur lors de la création du dispatch', error: error.message });
  }
};

// Récupérer tous les dispatches
exports.getDispatches = async (req, res) => {
  try {
    const { statut, magasin_id, date_debut, date_fin } = req.query;
    const where = {};

    // Filtres
    if (statut) where.statut = statut;
    if (magasin_id) {
      where[Op.or] = [
        { magasin_source_id: magasin_id },
        { magasin_destination_id: magasin_id }
      ];
    }
    if (date_debut && date_fin) {
      where.created_at = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    // Si l'utilisateur est manager, ne montrer que ses dispatches
    if (req.user.role === 'manager') {
      where.manager_id = req.user.id;
    }
    
    // Si l'utilisateur est operator, ne montrer que les dispatches vers son magasin
    if (req.user.role === 'operator' && req.user.magasin_id) {
      where.magasin_destination_id = req.user.magasin_id;
    }

    const dispatches = await Dispatch.findAll({
      where,
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'email'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' },
        { 
          model: Rotation, 
          as: 'rotations',
          include: [
            { model: Chauffeur, as: 'chauffeur' }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(dispatches);
  } catch (error) {
    console.error('Erreur récupération dispatches:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des dispatches', error: error.message });
  }
};

// Récupérer un dispatch spécifique
exports.getDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findByPk(req.params.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'nom', 'email'] },
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' },
        { 
          model: Rotation, 
          as: 'rotations',
          include: [
            { model: Chauffeur, as: 'chauffeur' },
            { model: User, as: 'operateur_reception', attributes: ['id', 'nom', 'email'] }
          ]
        }
      ]
    });

    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch non trouvé' });
    }

    res.json(dispatch);
  } catch (error) {
    console.error('Erreur récupération dispatch:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du dispatch', error: error.message });
  }
};

// Ajouter une rotation à un dispatch
exports.addRotation = async (req, res) => {
  try {
    const { dispatch_id } = req.params;
    const { chauffeur_id, quantite_prevue } = req.body;

    const dispatch = await Dispatch.findByPk(dispatch_id, {
      include: [{ model: Rotation, as: 'rotations' }]
    });

    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch non trouvé' });
    }

    // Vérifier que la quantité totale des rotations ne dépasse pas la quantité du dispatch
    const totalRotations = dispatch.rotations.reduce((sum, r) => sum + r.quantite_prevue, 0);
    
    if (totalRotations + quantite_prevue > dispatch.quantite_totale) {
      return res.status(400).json({ 
        message: 'La quantité totale des rotations dépasse la quantité du dispatch',
        quantiteDisponible: dispatch.quantite_totale - totalRotations
      });
    }

    // Créer la rotation
    const rotationIndex = dispatch.rotations.length + 1;
    const rotation = await Rotation.create({
      dispatch_id,
      chauffeur_id,
      numero_rotation: generateRotationNumber(dispatch.numero_dispatch, rotationIndex),
      quantite_prevue,
      statut: 'en_transit'
    });

    // Mettre à jour le statut du dispatch si nécessaire
    if (dispatch.statut === 'en_attente') {
      dispatch.statut = 'en_cours';
      await dispatch.save();
    }

    // Récupérer la rotation avec les associations
    const rotationComplete = await Rotation.findByPk(rotation.id, {
      include: [{ model: Chauffeur, as: 'chauffeur' }]
    });

    res.status(201).json({
      message: 'Rotation ajoutée avec succès',
      rotation: rotationComplete
    });
  } catch (error) {
    console.error('Erreur ajout rotation:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la rotation', error: error.message });
  }
};

// Annuler un dispatch
exports.cancelDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findByPk(req.params.id);

    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch non trouvé' });
    }

    if (dispatch.statut === 'termine') {
      return res.status(400).json({ message: 'Impossible d\'annuler un dispatch terminé' });
    }

    dispatch.statut = 'annule';
    await dispatch.save();

    res.json({ message: 'Dispatch annulé avec succès', dispatch });
  } catch (error) {
    console.error('Erreur annulation dispatch:', error);
    res.status(500).json({ message: 'Erreur lors de l\'annulation du dispatch', error: error.message });
  }
};

// Vérifier le stock disponible
// Récupérer l'état de progression des dispatches
exports.getDispatchesProgress = async (req, res) => {
  try {
    const { magasin_id } = req.query;
    const where = { statut: ['en_attente', 'partiel'] };
    
    if (magasin_id) {
      where.magasin_destination_id = magasin_id;
    }
    
    // Si l'utilisateur est operator, ne montrer que les dispatches vers son magasin
    if (req.user.role === 'operator' && req.user.magasin_id) {
      where.magasin_destination_id = req.user.magasin_id;
    }
    
    const dispatches = await Dispatch.findAll({
      where,
      include: [
        { model: Client, as: 'client' },
        { model: Produit, as: 'produit' },
        { model: Magasin, as: 'magasin_source' },
        { model: Magasin, as: 'magasin_destination' },
        { 
          model: Rotation, 
          as: 'rotations',
          attributes: ['id', 'quantite_prevue', 'quantite_livree', 'statut']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Calculer la progression pour chaque dispatch
    const dispatchesWithProgress = dispatches.map(dispatch => {
      const totalLivre = dispatch.rotations.reduce((sum, r) => sum + (r.quantite_prevue || 0), 0);
      const resteALivrer = dispatch.quantite_totale - totalLivre;
      const progression = (totalLivre / dispatch.quantite_totale) * 100;
      
      return {
        ...dispatch.toJSON(),
        total_livre: totalLivre,
        reste_a_livrer: resteALivrer,
        progression: progression,
        nombre_rotations: dispatch.rotations.length
      };
    });
    
    res.json(dispatchesWithProgress);
  } catch (error) {
    console.error('Erreur récupération progression dispatches:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la progression' });
  }
};

exports.checkStock = async (req, res) => {
  try {
    const { produit_id, magasin_id } = req.params;

    const stock = await Stock.findOne({
      where: { produit_id, magasin_id }
    });

    res.json({
      disponible: stock ? stock.quantite : 0,
      stock
    });
  } catch (error) {
    console.error('Erreur vérification stock:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du stock', error: error.message });
  }
};