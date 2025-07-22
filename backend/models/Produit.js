const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Produit = sequelize.define('Produit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categorie: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unite: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  destination: {
    type: DataTypes.ENUM('stockage', 'distribution', 'transformation', 'export'),
    defaultValue: 'stockage'
  },
  peut_etre_distribue: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes_destination: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  seuil_alerte: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'produits',
  timestamps: true,
  underscored: true
});

module.exports = Produit;