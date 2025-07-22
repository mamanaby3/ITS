const { Rotation, Dispatch, Stock, Mouvement, Chauffeur, User, Produit, Magasin } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

// Créer une nouvelle rotation
exports.createRotation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const rotationData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };

    const rotation = await Rotation.create(rotationData, { transaction });

    await transaction.commit();

    const newRotation = await Rotation.findByPk(rotation.id, {
      include: [
        { model: Dispatch, as: 'dispatch', include: [{ model: Produit, as: 'produit' }] },
        { model: Chauffeur, as: 'chauffeur' }
      ]
    });

    res.status(201).json({
      success: true,
      data: newRotation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création rotation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la rotation'
    });
  }
};

// Récupérer les rotations avec filtres
exports.getRotations = async (req, res) => {
  try {
    const { date, magasin_id, statut } = req.query;
    const whereClause = {};
    const dispatchWhereClause = {};

    if (date) {
      whereClause.date_arrivee = {
        [Op.gte]: new Date(date + 'T00:00:00'),
        [Op.lt]: new Date(date + 'T23:59:59')
      };
    }

    if (statut) {
      whereClause.statut = statut;
    }

    if (magasin_id) {
      dispatchWhereClause.magasin_destination_id = magasin_id;
    }

    const rotations = await Rotation.findAll({
      where: whereClause,
      include: [
        { 
          model: Dispatch, 
          as: 'dispatch',
          where: Object.keys(dispatchWhereClause).length > 0 ? dispatchWhereClause : undefined,
          include: [
            { model: Produit, as: 'produit' },
            { model: Magasin, as: 'magasin_source' },
            { model: Magasin, as: 'magasin_destination' }
          ]
        },
        { model: Chauffeur, as: 'chauffeur' },
        { model: User, as: 'reception_par' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rotations
    });
  } catch (error) {
    console.error('Erreur récupération rotations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rotations'
    });
  }
};

// Réceptionner une rotation
exports.receiveRotation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { rotation_id } = req.params;
    const { quantite_livree, notes } = req.body;
    const operateur_id = req.user.id;

    const rotation = await Rotation.findByPk(rotation_id, {
      include: [{ model: Dispatch, as: 'dispatch' }]
    });

    if (!rotation) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Rotation non trouvée' });
    }

    if (rotation.statut !== 'en_transit') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Cette rotation a déjà été traitée' });
    }

    // Calculer l'écart
    const ecart = rotation.quantite_prevue - quantite_livree;

    // Mettre à jour la rotation
    rotation.quantite_livree = quantite_livree;
    rotation.ecart = ecart;
    rotation.heure_arrivee = new Date();
    rotation.operateur_reception_id = operateur_id;
    rotation.notes = notes;
    rotation.statut = ecart === 0 ? 'livre' : 'manquant';
    await rotation.save({ transaction });

    const dispatch = rotation.dispatch;

    // Créer le mouvement de stock (sortie du magasin source)
    await Mouvement.create({
      type: 'sortie',
      produit_id: dispatch.produit_id,
      magasin_id: dispatch.magasin_source_id,
      quantite: quantite_livree,
      reference: rotation.numero_rotation,
      created_by: operateur_id,
      description: `Rotation ${rotation.numero_rotation} - Dispatch ${dispatch.numero_dispatch}`
    }, { transaction });

    // Créer le mouvement de stock (entrée dans le magasin destination)
    await Mouvement.create({
      type: 'entree',
      produit_id: dispatch.produit_id,
      magasin_id: dispatch.magasin_destination_id,
      quantite: quantite_livree,
      reference: rotation.numero_rotation,
      created_by: operateur_id,
      description: `Rotation ${rotation.numero_rotation} - Dispatch ${dispatch.numero_dispatch}`
    }, { transaction });

    // Mettre à jour le stock source
    const stockSource = await Stock.findOne({
      where: {
        produit_id: dispatch.produit_id,
        magasin_id: dispatch.magasin_source_id
      },
      transaction
    });

    if (stockSource) {
      stockSource.quantite -= quantite_livree;
      await stockSource.save({ transaction });
    }

    // Mettre à jour le stock destination
    let stockDestination = await Stock.findOne({
      where: {
        produit_id: dispatch.produit_id,
        magasin_id: dispatch.magasin_destination_id
      },
      transaction
    });

    if (!stockDestination) {
      stockDestination = await Stock.create({
        produit_id: dispatch.produit_id,
        magasin_id: dispatch.magasin_destination_id,
        quantite: 0
      }, { transaction });
    }

    stockDestination.quantite += quantite_livree;
    await stockDestination.save({ transaction });

    // Vérifier si toutes les rotations du dispatch sont terminées
    const rotations = await Rotation.findAll({
      where: { dispatch_id: dispatch.id },
      transaction
    });

    const allCompleted = rotations.every(r => r.statut !== 'en_transit');

    if (allCompleted) {
      dispatch.statut = 'termine';
      dispatch.date_completion = new Date();
      await dispatch.save({ transaction });
    }

    await transaction.commit();

    res.json({
      message: ecart > 0 
        ? `Rotation reçue avec un écart de ${ecart} tonnes`
        : 'Rotation reçue avec succès',
      rotation,
      ecart
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur réception rotation:', error);
    res.status(500).json({ message: 'Erreur lors de la réception de la rotation', error: error.message });
  }
};

// Récupérer les rotations en transit
exports.getRotationsEnTransit = async (req, res) => {
  try {
    console.log('=== DEBUG ROTATIONS EN TRANSIT ===');
    console.log('User:', req.user.email, 'Role:', req.user.role, 'Magasin ID:', req.user.magasin_id);
    
    const { magasin_id } = req.query;

    let whereClause = { statut: 'en_transit' };
    let includeOptions = [
      {
        model: Dispatch,
        as: 'dispatch',
        required: true,
        include: [
          { model: Produit, as: 'produit' },
          { model: Magasin, as: 'magasin_source' },
          { model: Magasin, as: 'magasin_destination' },
          { model: User, as: 'manager', attributes: ['id', 'nom', 'email'] },
          { model: Client, as: 'client' }
        ]
      },
      { model: Chauffeur, as: 'chauffeur' }
    ];

    // Si un magasin est spécifié dans la requête, filtrer par magasin de destination
    if (magasin_id) {
      includeOptions[0].where = { magasin_destination_id: magasin_id };
    }
    
    // Pour les opérateurs, filtrer automatiquement par leur magasin
    if (req.user.role === 'operator' && req.user.magasin_id) {
      // Garder le magasin_id tel quel (peut être string ou number)
      const userMagasinId = req.user.magasin_id;
      includeOptions[0].where = { magasin_destination_id: userMagasinId };
      console.log('Filtrage pour opérateur - magasin_id:', userMagasinId, 'type:', typeof userMagasinId);
    }

    // D'abord, récupérer toutes les rotations pour debug
    if (req.user.role === 'operator') {
      const allRotations = await Rotation.findAll({
        where: { statut: 'en_transit' },
        include: [{
          model: Dispatch,
          as: 'dispatch',
          include: [
            { model: Magasin, as: 'magasin_destination' }
          ]
        }]
      });
      console.log('=== TOUTES LES ROTATIONS EN TRANSIT ===');
      allRotations.forEach(r => {
        console.log(`Rotation ${r.numero_rotation}: Destination magasin_id=${r.dispatch.magasin_destination_id} (${r.dispatch.magasin_destination?.nom})`);
      });
    }

    const rotations = await Rotation.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['heure_depart', 'DESC']]
    });

    console.log(`Rotations trouvées: ${rotations.length} pour ${req.user.role} (magasin: ${req.user.magasin_id})`);
    res.json(rotations);
  } catch (error) {
    console.error('Erreur récupération rotations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rotations', error: error.message });
  }
};

// Récupérer l'historique des rotations
exports.getRotationsHistory = async (req, res) => {
  try {
    const { chauffeur_id, date_debut, date_fin, statut } = req.query;
    const where = {};

    if (chauffeur_id) where.chauffeur_id = chauffeur_id;
    if (statut) where.statut = statut;
    if (date_debut && date_fin) {
      where.created_at = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    const rotations = await Rotation.findAll({
      where,
      include: [
        {
          model: Dispatch,
          as: 'dispatch',
          include: [
            { model: Produit, as: 'produit' },
            { model: Client, as: 'client' }
          ]
        },
        { model: Chauffeur, as: 'chauffeur' },
        { model: User, as: 'operateur_reception', attributes: ['id', 'nom', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(rotations);
  } catch (error) {
    console.error('Erreur historique rotations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
};

// Rapport des écarts
exports.getEcartsReport = async (req, res) => {
  try {
    const { date_debut, date_fin, chauffeur_id } = req.query;
    const where = {
      ecart: { [Op.gt]: 0 }
    };

    if (chauffeur_id) where.chauffeur_id = chauffeur_id;
    if (date_debut && date_fin) {
      where.heure_arrivee = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    const rotations = await Rotation.findAll({
      where,
      include: [
        {
          model: Dispatch,
          as: 'dispatch',
          include: [
            { model: Produit, as: 'produit' },
            { model: Client, as: 'client' }
          ]
        },
        { model: Chauffeur, as: 'chauffeur' }
      ],
      order: [['ecart', 'DESC']]
    });

    // Statistiques par chauffeur
    const statsChauffeur = await Rotation.findAll({
      where: { ecart: { [Op.gt]: 0 } },
      attributes: [
        'chauffeur_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'nombre_ecarts'],
        [sequelize.fn('SUM', sequelize.col('ecart')), 'total_ecart'],
        [sequelize.fn('AVG', sequelize.col('ecart')), 'ecart_moyen']
      ],
      include: [{ model: Chauffeur, as: 'chauffeur', attributes: ['nom'] }],
      group: ['chauffeur_id', 'chauffeur.id']
    });

    res.json({
      rotations,
      statistiques: statsChauffeur
    });
  } catch (error) {
    console.error('Erreur rapport écarts:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport', error: error.message });
  }
};