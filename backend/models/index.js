const { sequelize } = require('../config/database');
const User = require('./User');
const Magasin = require('./Magasin');
const Produit = require('./Produit');
const Stock = require('./Stock');
const Client = require('./Client');
const Commande = require('./Commande');
const CommandeDetail = require('./CommandeDetail');
const Livraison = require('./Livraison');
const Mouvement = require('./Mouvement');
const Chauffeur = require('./Chauffeur');
const Dispatch = require('./Dispatch');
const Rotation = require('./Rotation');
const DispatchLivraison = require('./DispatchLivraison');

// Associations
// User associations
User.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Magasin.hasMany(User, { foreignKey: 'magasin_id', as: 'users' });

// Stock associations
Stock.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });
Stock.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Produit.hasMany(Stock, { foreignKey: 'produit_id', as: 'stocks' });
Magasin.hasMany(Stock, { foreignKey: 'magasin_id', as: 'stocks' });

// Client associations
Client.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Client.hasMany(Commande, { foreignKey: 'client_id', as: 'commandes' });
Magasin.hasMany(Client, { foreignKey: 'magasin_id', as: 'clients' });

// Commande associations
Commande.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Commande.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Commande.belongsTo(User, { foreignKey: 'created_by', as: 'createur' });
Commande.hasMany(CommandeDetail, { foreignKey: 'commande_id', as: 'details' });
Commande.hasOne(Livraison, { foreignKey: 'commande_id', as: 'livraison' });

// CommandeDetail associations
CommandeDetail.belongsTo(Commande, { foreignKey: 'commande_id' });
CommandeDetail.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });
Produit.hasMany(CommandeDetail, { foreignKey: 'produit_id', as: 'commande_details' });

// Livraison associations
Livraison.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });
Livraison.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Livraison.belongsTo(User, { foreignKey: 'created_by', as: 'createur' });
Magasin.hasMany(Livraison, { foreignKey: 'magasin_id', as: 'livraisons' });

// Mouvement associations
Mouvement.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });
Mouvement.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Mouvement.belongsTo(Magasin, { foreignKey: 'magasin_destination_id', as: 'magasin_destination' });
Mouvement.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });
Mouvement.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Mouvement.belongsTo(User, { foreignKey: 'created_by', as: 'createur' });
Produit.hasMany(Mouvement, { foreignKey: 'produit_id', as: 'mouvements' });
Magasin.hasMany(Mouvement, { foreignKey: 'magasin_id', as: 'mouvements' });
Client.hasMany(Mouvement, { foreignKey: 'client_id', as: 'mouvements' });

// Chauffeur associations
Chauffeur.belongsTo(Magasin, { foreignKey: 'magasin_id', as: 'magasin' });
Chauffeur.hasMany(Rotation, { foreignKey: 'chauffeur_id', as: 'rotations' });
Magasin.hasMany(Chauffeur, { foreignKey: 'magasin_id', as: 'chauffeurs' });

// Dispatch associations
Dispatch.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
Dispatch.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Dispatch.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });
Dispatch.belongsTo(Magasin, { foreignKey: 'magasin_source_id', as: 'magasin_source' });
Dispatch.belongsTo(Magasin, { foreignKey: 'magasin_destination_id', as: 'magasin_destination' });
Dispatch.hasMany(Rotation, { foreignKey: 'dispatch_id', as: 'rotations' });

// Rotation associations
Rotation.belongsTo(Dispatch, { foreignKey: 'dispatch_id', as: 'dispatch' });
Rotation.belongsTo(Chauffeur, { foreignKey: 'chauffeur_id', as: 'chauffeur' });
Rotation.belongsTo(User, { foreignKey: 'operateur_reception_id', as: 'operateur_reception' });

// DispatchLivraison associations
DispatchLivraison.belongsTo(Dispatch, { foreignKey: 'dispatch_id', as: 'dispatch' });
DispatchLivraison.belongsTo(User, { foreignKey: 'magasinier_id', as: 'magasinier' });
Dispatch.hasMany(DispatchLivraison, { foreignKey: 'dispatch_id', as: 'livraisons' });

module.exports = {
  sequelize,
  User,
  Magasin,
  Produit,
  Stock,
  Client,
  Commande,
  CommandeDetail,
  Livraison,
  Mouvement,
  Chauffeur,
  Dispatch,
  Rotation,
  DispatchLivraison
};