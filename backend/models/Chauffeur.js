const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chauffeur = sequelize.define('Chauffeur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numero_permis: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  numero_camion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  capacite_camion: {
    type: DataTypes.FLOAT,
    defaultValue: 40.0,
    comment: 'Capacité en tonnes'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif'),
    defaultValue: 'actif'
  },
  magasin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Magasins',
      key: 'id'
    }
  }
}, {
  tableName: 'chauffeurs',
  timestamps: true,
  underscored: true
});

module.exports = Chauffeur;