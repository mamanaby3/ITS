require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDatabase() {
    let connection;
    
    try {
        console.log('🔄 Mise à jour de la base de données...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock',
            multipleStatements: true
        });
        
        console.log('✅ Connexion établie');
        
        // 1. Modifier la colonne role
        console.log('🔄 Mise à jour de la structure...');
        await connection.query(
            `ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'manager', 'operator') NOT NULL`
        );
        console.log('✅ Structure mise à jour');
        
        // 2. Mettre à jour l'utilisateur admin
        await connection.query(
            `UPDATE utilisateurs SET role = 'admin' WHERE email = 'admin@its-senegal.com'`
        );
        console.log('✅ Utilisateur admin mis à jour');
        
        // 3. Créer la table clients si elle n'existe pas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                nom VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                telephone VARCHAR(50),
                adresse TEXT,
                ville VARCHAR(100),
                pays VARCHAR(100) DEFAULT 'Sénégal',
                credit_limit DECIMAL(12,2) DEFAULT 0,
                credit_utilise DECIMAL(12,2) DEFAULT 0,
                actif BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table clients créée/vérifiée');
        
        // 4. Ajouter des clients de test
        const clients = [
            ['CLI-001', 'Société Import Export SA', 'contact@importexport.sn', '+221 33 123 45 67', 'Dakar'],
            ['CLI-002', 'Groupe Agricole du Sénégal', 'info@gas.sn', '+221 33 234 56 78', 'Thiès'],
            ['CLI-003', 'Distribution Nationale SARL', 'contact@distnat.sn', '+221 33 345 67 89', 'Saint-Louis']
        ];
        
        for (const client of clients) {
            await connection.query(
                `INSERT IGNORE INTO clients (code, nom, email, telephone, ville) VALUES (?, ?, ?, ?, ?)`,
                client
            );
        }
        console.log('✅ Clients de test ajoutés');
        
        // 5. Ajouter quelques produits si la table est vide
        const [produits] = await connection.query('SELECT COUNT(*) as count FROM produits');
        if (produits[0].count === 0) {
            const produitsData = [
                ['PROD-001', 'Blé tendre', 'Céréales', 'Blé de qualité supérieure', 'tonnes', 250000, 100],
                ['PROD-002', 'Riz parfumé', 'Céréales', 'Riz importé de Thaïlande', 'tonnes', 450000, 50],
                ['PROD-003', 'Maïs jaune', 'Céréales', 'Maïs pour alimentation animale', 'tonnes', 200000, 200],
                ['PROD-004', 'Soja', 'Légumineuses', 'Soja OGM-free', 'tonnes', 350000, 75]
            ];
            
            for (const produit of produitsData) {
                await connection.query(
                    `INSERT INTO produits (reference, nom, categorie, description, unite, prix_unitaire, seuil_alerte) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    produit
                );
            }
            console.log('✅ Produits de test ajoutés');
        }
        
        // Vérifier l'utilisateur
        const [users] = await connection.query(
            `SELECT id, email, role FROM utilisateurs WHERE email = 'admin@its-senegal.com'`
        );
        
        if (users.length > 0) {
            console.log('\n📊 Utilisateur admin:');
            console.log('📧 Email:', users[0].email);
            console.log('👤 Rôle:', users[0].role);
        }
        
        console.log('\n✅ Base de données mise à jour avec succès!');
        console.log('🚀 Redémarrez le serveur backend pour appliquer les changements');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Détails:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateDatabase();