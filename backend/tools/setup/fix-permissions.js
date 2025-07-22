require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixPermissions() {
    let connection;
    
    try {
        console.log('🔄 Mise à jour des permissions utilisateur...');
        
        // Connexion à MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });
        
        console.log('✅ Connexion établie');
        
        // Mettre à jour le rôle de l'admin
        const [result] = await connection.query(
            `UPDATE utilisateurs SET role = 'admin' WHERE email = 'admin@its-senegal.com'`
        );
        console.log('Lignes mises à jour:', result.affectedRows);
        
        console.log('✅ Rôle admin mis à jour');
        
        // Vérifier l'utilisateur
        const [users] = await connection.query(
            `SELECT id, email, role FROM utilisateurs WHERE email = 'admin@its-senegal.com'`
        );
        
        if (users.length > 0) {
            console.log('📧 Utilisateur:', users[0].email);
            console.log('👤 Rôle:', users[0].role);
            console.log('✅ Permissions mises à jour avec succès!');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixPermissions();