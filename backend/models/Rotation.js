const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rotation = sequelize.define('Rotation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dispatch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Dispatches',
      key: 'id'
    }
  },
  chauffeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Chauffeurs',
      key: 'id'
    }
  },
  numero_rotation: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  quantite_prevue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Quantité prévue en tonnes'
  },
  quantite_livree: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Quantité réellement livrée en tonnes'
  },
  ecart: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Écart entre prévu et livré'
  },
  heure_depart: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  heure_arrivee: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('planifie', 'en_transit', 'livre', 'annule'),
    defaultValue: 'planifie'
  },
  operateur_reception_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'rotations',
  timestamps: true,
  underscored: true
});

module.exports = Rotation;