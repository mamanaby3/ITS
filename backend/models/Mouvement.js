const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mouvement = sequelize.define('Mouvement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('dispatch', 'entree', 'sortie', 'transfert', 'ajustement', 'perte', 'retour'),
    allowNull: false
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'produits',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false
  },
  magasin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  magasin_destination_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  lot_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  fournisseur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  fournisseur_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'clients',
      key: 'id'
    },
    allowNull: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'clients',
      key: 'id'
    },
    allowNull: true
  },
  type_livraison: {
    type: DataTypes.ENUM('client', 'stock'),
    allowNull: true,
    defaultValue: 'client'
  },
  numero_bl: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date_livraison: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transporteur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  nom_chauffeur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  telephone_chauffeur: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  numero_camion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  raison: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  commande_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'commandes',
      key: 'id'
    },
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'mouvements_stock',
  timestamps: true,
  underscored: true
});

module.exports = Mouvement;