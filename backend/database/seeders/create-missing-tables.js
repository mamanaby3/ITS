require('dotenv').config();
const mysql = require('mysql2/promise');

async function createMissingTables() {
    let connection;
    
    try {
        console.log('🔄 Création des tables manquantes...\n');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });
        
        // Table commandes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS commandes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                numero VARCHAR(50) UNIQUE NOT NULL,
                client_id INT NOT NULL,
                date_commande DATE NOT NULL,
                statut ENUM('brouillon', 'confirmee', 'en_preparation', 'prete', 'en_livraison', 'livree', 'annulee') DEFAULT 'brouillon',
                montant_total DECIMAL(12,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        `);
        console.log('✅ Table commandes créée/vérifiée');
        
        console.log('\n✅ Toutes les tables sont maintenant créées!');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createMissingTables();