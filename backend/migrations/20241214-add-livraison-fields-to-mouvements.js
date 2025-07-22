'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mouvements_stock', 'client_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'clients',
        key: 'id'
      },
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'numero_bl', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'date_livraison', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'transporteur', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'nom_chauffeur', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'telephone_chauffeur', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'numero_camion', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'date_expiration', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'prix_unitaire', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    });

    await queryInterface.addColumn('mouvements_stock', 'observations', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('mouvements_stock', ['numero_bl']);
    await queryInterface.addIndex('mouvements_stock', ['client_id']);
    await queryInterface.addIndex('mouvements_stock', ['date_livraison']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('mouvements_stock', ['date_livraison']);
    await queryInterface.removeIndex('mouvements_stock', ['client_id']);
    await queryInterface.removeIndex('mouvements_stock', ['numero_bl']);
    
    await queryInterface.removeColumn('mouvements_stock', 'observations');
    await queryInterface.removeColumn('mouvements_stock', 'prix_unitaire');
    await queryInterface.removeColumn('mouvements_stock', 'date_expiration');
    await queryInterface.removeColumn('mouvements_stock', 'numero_camion');
    await queryInterface.removeColumn('mouvements_stock', 'telephone_chauffeur');
    await queryInterface.removeColumn('mouvements_stock', 'nom_chauffeur');
    await queryInterface.removeColumn('mouvements_stock', 'transporteur');
    await queryInterface.removeColumn('mouvements_stock', 'date_livraison');
    await queryInterface.removeColumn('mouvements_stock', 'numero_bl');
    await queryInterface.removeColumn('mouvements_stock', 'client_id');
  }
};