const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Navire = sequelize.define('Navire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom_navire: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  numero_imo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  date_arrivee: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date_depart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  port_origine: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  port_destination: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'en_dechargement', 'decharge', 'parti'),
    defaultValue: 'en_attente'
  },
  tonnage_total: {
    type: DataTypes.DECIMAL(15, 3),
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
  tableName: 'navires',
  timestamps: true,
  underscored: true
});

module.exports = Navire;