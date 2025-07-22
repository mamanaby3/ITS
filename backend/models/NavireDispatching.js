const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NavireDispatching = sequelize.define('NavireDispatching', {
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
  cargaison_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'navire_cargaison',
      key: 'id'
    }
  },
  numero_camion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  transporteur: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  chauffeur_nom: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  destination: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  quantite_chargee: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  date_chargement: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  heure_depart: {
    type: DataTypes.TIME,
    allowNull: true
  },
  heure_arrivee_prevue: {
    type: DataTypes.TIME,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('chargement', 'en_route', 'livre', 'annule'),
    defaultValue: 'chargement'
  },
  numero_bon_livraison: {
    type: DataTypes.STRING(50),
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
  tableName: 'navire_dispatching',
  timestamps: true,
  underscored: true
});

module.exports = NavireDispatching;