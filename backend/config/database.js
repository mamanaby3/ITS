const { Sequelize } = require('sequelize');
const path = require('path');

// Configuration pour MySQL puisque SQLite a des problèmes
const sequelize = new Sequelize(
  process.env.DB_NAME || 'its_maritime_stock',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

module.exports = { sequelize };