const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Dispatch = sequelize.define('Dispatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_dispatch: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'id'
    }
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Produits',
      key: 'id'
    }
  },
  magasin_source_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  magasin_destination_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'magasins',
      key: 'id'
    }
  },
  quantite_totale: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Quantité totale en tonnes'
  },
  quantite_client: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantité à livrer directement au client'
  },
  quantite_stock: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantité à mettre en stock au magasin destination'
  },
  type_dispatch: {
    type: DataTypes.ENUM('direct_client', 'stock_magasin', 'mixte'),
    allowNull: false,
    defaultValue: 'stock_magasin',
    comment: 'Type de dispatch: direct au client, stock magasin ou mixte'
  },
  statut: {
    type: DataTypes.ENUM('planifie', 'en_cours', 'complete', 'annule'),
    defaultValue: 'planifie'
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  date_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'dispatches',
  timestamps: true,
  underscored: true
});

// Fonction pour générer le numéro de dispatch
const generateNumeroDispatch = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Trouver le dernier numéro pour ce mois
  const lastDispatch = await Dispatch.findOne({
    where: sequelize.where(
      sequelize.fn('YEAR', sequelize.col('created_at')),
      year
    ),
    order: [['created_at', 'DESC']]
  });
  
  let sequence = 1;
  if (lastDispatch && lastDispatch.numero_dispatch) {
    const lastNumber = parseInt(lastDispatch.numero_dispatch.split('-').pop());
    sequence = lastNumber + 1;
  }
  
  return `DISP-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Hook pour générer automatiquement le numéro de dispatch
Dispatch.beforeCreate(async (dispatch) => {
  if (!dispatch.numero_dispatch) {
    dispatch.numero_dispatch = await generateNumeroDispatch();
  }
});

// Hook pour valider les quantités
Dispatch.beforeSave(async (dispatch) => {
  // Valider que la somme des quantités correspond au total
  if (dispatch.changed('quantite_client') || dispatch.changed('quantite_stock') || dispatch.changed('quantite_totale')) {
    const totalCalcule = parseFloat(dispatch.quantite_client || 0) + parseFloat(dispatch.quantite_stock || 0);
    if (Math.abs(totalCalcule - parseFloat(dispatch.quantite_totale)) > 0.01) {
      throw new Error('La somme des quantités client et stock doit égaler la quantité totale');
    }
  }
  
  // Déterminer automatiquement le type de dispatch
  if (dispatch.quantite_client > 0 && dispatch.quantite_stock > 0) {
    dispatch.type_dispatch = 'mixte';
  } else if (dispatch.quantite_client > 0) {
    dispatch.type_dispatch = 'direct_client';
  } else {
    dispatch.type_dispatch = 'stock_magasin';
  }
});

module.exports = Dispatch;