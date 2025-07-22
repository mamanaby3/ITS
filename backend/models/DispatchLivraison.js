const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DispatchLivraison = sequelize.define('DispatchLivraison', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dispatch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dispatches',
      key: 'id'
    }
  },
  magasinier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Magasinier qui enregistre la livraison'
  },
  type_livraison: {
    type: DataTypes.ENUM('client', 'stock'),
    allowNull: false,
    comment: 'Type de livraison: client direct ou mise en stock'
  },
  quantite_livree: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Quantité effectivement livrée en tonnes'
  },
  date_livraison: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  numero_bon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Numéro du bon de livraison'
  },
  transporteur: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numero_camion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  chauffeur_nom: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('enregistree', 'validee', 'annulee'),
    defaultValue: 'enregistree'
  }
}, {
  tableName: 'dispatch_livraisons',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['dispatch_id']
    },
    {
      fields: ['magasinier_id']
    },
    {
      fields: ['date_livraison']
    }
  ]
});

// Fonction pour générer le numéro de bon
const generateNumeroBon = async (type) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = type === 'client' ? 'BLC' : 'BLS'; // BLC pour client, BLS pour stock
  
  // Trouver le dernier numéro pour aujourd'hui
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const lastLivraison = await DispatchLivraison.findOne({
    where: {
      date_livraison: {
        [sequelize.Op.between]: [startOfDay, endOfDay]
      }
    },
    order: [['created_at', 'DESC']]
  });
  
  let sequence = 1;
  if (lastLivraison && lastLivraison.numero_bon) {
    const matches = lastLivraison.numero_bon.match(/(\d+)$/);
    if (matches) {
      sequence = parseInt(matches[1]) + 1;
    }
  }
  
  return `${prefix}-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;
};

// Hook pour générer automatiquement le numéro de bon
DispatchLivraison.beforeCreate(async (livraison) => {
  if (!livraison.numero_bon) {
    livraison.numero_bon = await generateNumeroBon(livraison.type_livraison);
  }
});

module.exports = DispatchLivraison;