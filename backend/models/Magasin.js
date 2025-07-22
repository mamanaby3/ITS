const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Magasin = sequelize.define('Magasin', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  zone: {
    type: DataTypes.STRING(50)
  },
  adresse: {
    type: DataTypes.TEXT
  },
  telephone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true
    }
  },
  manager_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'magasins',
  timestamps: true,
  underscored: true
});

module.exports = Magasin;