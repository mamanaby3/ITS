const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommandeDetail = sequelize.define('CommandeDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Commandes',
      key: 'id'
    }
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Produits',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  tableName: 'commande_details',
  timestamps: false,
  underscored: true
});

module.exports = CommandeDetail;