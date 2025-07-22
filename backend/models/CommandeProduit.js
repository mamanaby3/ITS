const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommandeProduit = sequelize.define('CommandeProduit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commandes',
      key: 'id'
    }
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'produits',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  remise: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  montant_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
});

module.exports = CommandeProduit;