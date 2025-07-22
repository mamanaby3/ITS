const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pays: {
    type: DataTypes.STRING,
    defaultValue: 'Sénégal'
  },
  type_client: {
    type: DataTypes.ENUM('entreprise', 'particulier', 'gouvernement'),
    defaultValue: 'entreprise'
  },
  magasin_id: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  credit_limit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  credit_utilise: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'clients',
  timestamps: true,
  underscored: true
});

module.exports = Client;