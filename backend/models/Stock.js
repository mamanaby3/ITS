const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'produits',
      key: 'id'
    }
  },
  magasin_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  quantite_disponible: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  quantite_reservee: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0
  },
  valeur_unitaire: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  lot_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  date_entree: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emplacement: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  derniere_entree: {
    type: DataTypes.DATE,
    allowNull: true
  },
  derniere_sortie: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'stocks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['produit_id', 'magasin_id']
    },
    {
      fields: ['magasin_id']
    },
    {
      fields: ['produit_id']
    }
  ]
});

module.exports = Stock;