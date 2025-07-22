const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NavireCargaison = sequelize.define('NavireCargaison', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  navire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'navires',
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
  quantite_declaree: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  quantite_receptionnee: {
    type: DataTypes.DECIMAL(15, 3),
    defaultValue: 0
  },
  magasin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  numero_lot: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date_reception: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'complete', 'ecart'),
    defaultValue: 'en_attente'
  },
  ecart_quantite: {
    type: DataTypes.DECIMAL(15, 3),
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'navire_cargaison',
  timestamps: true,
  underscored: true
});

module.exports = NavireCargaison;