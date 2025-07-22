const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStructure() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });

        console.log('Structure de la table mouvements_stock:\n');
        
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mouvements_stock'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'its_maritime_stock']);
        
        columns.forEach(col => {
            console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkStructure();