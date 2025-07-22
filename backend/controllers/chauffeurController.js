const { Chauffeur, Rotation, Magasin } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

// Créer un nouveau chauffeur
exports.createChauffeur = async (req, res) => {
  try {
    const { nom, telephone, numero_permis, numero_camion, capacite_camion, magasin_id } = req.body;

    // Vérifier si le numéro de permis existe déjà
    const existing = await Chauffeur.findOne({
      where: { numero_permis }
    });

    if (existing) {
      return res.status(400).json({ message: 'Ce numéro de permis existe déjà' });
    }

    const chauffeur = await Chauffeur.create({
      nom,
      telephone,
      numero_permis,
      numero_camion,
      capacite_camion: capacite_camion || 40,
      magasin_id,
      statut: 'actif'
    });

    const chauffeurComplet = await Chauffeur.findByPk(chauffeur.id, {
      include: [{ model: Magasin, as: 'magasin' }]
    });

    res.status(201).json({
      message: 'Chauffeur créé avec succès',
      chauffeur: chauffeurComplet
    });
  } catch (error) {
    console.error('Erreur création chauffeur:', error);
    res.status(500).json({ message: 'Erreur lors de la création du chauffeur', error: error.message });
  }
};

// Récupérer tous les chauffeurs
exports.getChauffeurs = async (req, res) => {
  try {
    const { magasin_id, statut } = req.query;
    const where = {};

    if (magasin_id) where.magasin_id = magasin_id;
    if (statut) where.statut = statut;

    const chauffeurs = await Chauffeur.findAll({
      where,
      include: [
        { model: Magasin, as: 'magasin' },
        { 
          model: Rotation, 
          as: 'rotations',
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['nom', 'ASC']]
    });

    res.json(chauffeurs);
  } catch (error) {
    console.error('Erreur récupération chauffeurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des chauffeurs', error: error.message });
  }
};

// Récupérer un chauffeur spécifique
exports.getChauffeur = async (req, res) => {
  try {
    const chauffeur = await Chauffeur.findByPk(req.params.id, {
      include: [
        { model: Magasin, as: 'magasin' },
        { 
          model: Rotation, 
          as: 'rotations',
          order: [['created_at', 'DESC']],
          limit: 20
        }
      ]
    });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }

    // Calculer les statistiques
    const stats = await Rotation.findOne({
      where: { chauffeur_id: chauffeur.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_rotations'],
        [sequelize.fn('SUM', sequelize.col('quantite_prevue')), 'total_prevu'],
        [sequelize.fn('SUM', sequelize.col('quantite_livree')), 'total_livre'],
        [sequelize.fn('SUM', sequelize.col('ecart')), 'total_ecart'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN ecart > 0 THEN 1 END')), 'nombre_ecarts']
      ],
      raw: true
    });

    res.json({
      chauffeur,
      statistiques: stats
    });
  } catch (error) {
    console.error('Erreur récupération chauffeur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du chauffeur', error: error.message });
  }
};

// Mettre à jour un chauffeur
exports.updateChauffeur = async (req, res) => {
  try {
    const chauffeur = await Chauffeur.findByPk(req.params.id);

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }

    const { nom, telephone, numero_permis, numero_camion, capacite_camion, statut } = req.body;

    // Vérifier l'unicité du numéro de permis si modifié
    if (numero_permis && numero_permis !== chauffeur.numero_permis) {
      const existing = await Chauffeur.findOne({
        where: { 
          numero_permis,
          id: { [Op.ne]: chauffeur.id }
        }
      });

      if (existing) {
        return res.status(400).json({ message: 'Ce numéro de permis existe déjà' });
      }
    }

    await chauffeur.update({
      nom: nom || chauffeur.nom,
      telephone: telephone || chauffeur.telephone,
      numero_permis: numero_permis || chauffeur.numero_permis,
      numero_camion: numero_camion || chauffeur.numero_camion,
      capacite_camion: capacite_camion || chauffeur.capacite_camion,
      statut: statut || chauffeur.statut
    });

    const chauffeurMisAJour = await Chauffeur.findByPk(chauffeur.id, {
      include: [{ model: Magasin, as: 'magasin' }]
    });

    res.json({
      message: 'Chauffeur mis à jour avec succès',
      chauffeur: chauffeurMisAJour
    });
  } catch (error) {
    console.error('Erreur mise à jour chauffeur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du chauffeur', error: error.message });
  }
};

// Supprimer un chauffeur (désactiver)
exports.deleteChauffeur = async (req, res) => {
  try {
    const chauffeur = await Chauffeur.findByPk(req.params.id);

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }

    // Vérifier s'il a des rotations en cours
    const rotationsEnCours = await Rotation.count({
      where: {
        chauffeur_id: chauffeur.id,
        statut: 'en_transit'
      }
    });

    if (rotationsEnCours > 0) {
      return res.status(400).json({ 
        message: 'Impossible de désactiver ce chauffeur, il a des rotations en cours'
      });
    }

    chauffeur.statut = 'inactif';
    await chauffeur.save();

    res.json({ message: 'Chauffeur désactivé avec succès' });
  } catch (error) {
    console.error('Erreur suppression chauffeur:', error);
    res.status(500).json({ message: 'Erreur lors de la désactivation du chauffeur', error: error.message });
  }
};