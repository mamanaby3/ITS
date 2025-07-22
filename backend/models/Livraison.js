const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Livraison = sequelize.define('Livraison', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commandes',
      key: 'id'
    }
  },
  magasin_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  date_programmee: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date_livraison: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('programmee', 'en_chargement', 'en_route', 'livree', 'retournee', 'incident'),
    defaultValue: 'programmee'
  },
  transporteur: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicule: {
    type: DataTypes.STRING,
    allowNull: true
  },
  chauffeur: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'livraisons',
  timestamps: true,
  underscored: true
});

module.exports = Livraison;