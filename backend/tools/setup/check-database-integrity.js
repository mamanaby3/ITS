const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseIntegrity() {
    let connection;
    
    try {
        // Connexion à la base de données
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });

        console.log('✅ Connexion établie à la base de données its_maritime_stock\n');

        // Tables attendues selon le schéma
        const expectedTables = [
            'magasins', 'utilisateurs', 'produits', 'navires', 
            'navire_cargaison', 'navire_dispatching', 'stocks', 
            'clients', 'mouvements_stock', 'commandes', 
            'commande_details', 'livraisons'
        ];

        // Vérifier les tables existantes
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            ORDER BY TABLE_NAME`, 
            [process.env.DB_NAME || 'its_maritime_stock']
        );

        const existingTables = tables.map(t => t.TABLE_NAME);
        
        console.log('📊 ANALYSE DES TABLES:\n');
        console.log('Tables attendues:', expectedTables.length);
        console.log('Tables trouvées:', existingTables.length);
        console.log('\n');

        // Tables manquantes
        const missingTables = expectedTables.filter(t => !existingTables.includes(t));
        if (missingTables.length > 0) {
            console.log('❌ Tables manquantes:');
            missingTables.forEach(t => console.log(`   - ${t}`));
        } else {
            console.log('✅ Toutes les tables principales sont présentes');
        }

        // Tables supplémentaires
        const extraTables = existingTables.filter(t => !expectedTables.includes(t));
        if (extraTables.length > 0) {
            console.log('\n📌 Tables supplémentaires trouvées:');
            extraTables.forEach(t => console.log(`   - ${t}`));
        }

        // Vérifier le contenu des tables principales
        console.log('\n\n📊 CONTENU DES TABLES PRINCIPALES:\n');
        
        const tableChecks = [
            { name: 'magasins', icon: '🏭' },
            { name: 'utilisateurs', icon: '👥' },
            { name: 'produits', icon: '📦' },
            { name: 'navires', icon: '🚢' },
            { name: 'clients', icon: '🏢' },
            { name: 'stocks', icon: '📊' },
            { name: 'mouvements_stock', icon: '↔️' },
            { name: 'commandes', icon: '📝' }
        ];

        for (const table of tableChecks) {
            if (existingTables.includes(table.name)) {
                const [[{ count }]] = await connection.query(
                    `SELECT COUNT(*) as count FROM ${table.name}`
                );
                console.log(`${table.icon} ${table.name}: ${count} enregistrements`);
            }
        }

        // Vérifier les utilisateurs et leurs rôles
        console.log('\n\n👥 UTILISATEURS:\n');
        const [users] = await connection.query(`
            SELECT role, COUNT(*) as count 
            FROM utilisateurs 
            WHERE actif = 1 
            GROUP BY role
        `);
        
        users.forEach(u => {
            console.log(`   ${u.role}: ${u.count} utilisateur(s)`);
        });

        // Vérifier l'état des stocks
        console.log('\n\n📊 ÉTAT DES STOCKS:\n');
        const [stockStatus] = await connection.query(`
            SELECT 
                m.nom as magasin,
                COUNT(DISTINCT s.produit_id) as nb_produits,
                ROUND(SUM(s.quantite_disponible), 2) as total_disponible
            FROM stocks s
            JOIN magasins m ON s.magasin_id = m.id
            GROUP BY m.id, m.nom
            ORDER BY m.nom
        `);

        if (stockStatus.length > 0) {
            stockStatus.forEach(s => {
                console.log(`   ${s.magasin}: ${s.nb_produits} produits, ${s.total_disponible || 0} tonnes`);
            });
        } else {
            console.log('   Aucun stock enregistré');
        }

        // Vérifier les derniers mouvements
        console.log('\n\n↔️ DERNIERS MOUVEMENTS:\n');
        const [movements] = await connection.query(`
            SELECT 
                type_mouvement,
                COUNT(*) as count,
                MAX(date_mouvement) as dernier_mouvement
            FROM mouvements_stock
            GROUP BY type_mouvement
        `);

        if (movements.length > 0) {
            movements.forEach(m => {
                const date = m.dernier_mouvement ? new Date(m.dernier_mouvement).toLocaleDateString('fr-FR') : 'N/A';
                console.log(`   ${m.type_mouvement}: ${m.count} mouvement(s), dernier le ${date}`);
            });
        } else {
            console.log('   Aucun mouvement enregistré');
        }

        // Vérifier les contraintes de clés étrangères
        console.log('\n\n🔗 CONTRAINTES DE CLÉS ÉTRANGÈRES:\n');
        const [constraints] = await connection.query(`
            SELECT 
                TABLE_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, CONSTRAINT_NAME`,
            [process.env.DB_NAME || 'its_maritime_stock']
        );

        const tableConstraints = {};
        constraints.forEach(c => {
            if (!tableConstraints[c.TABLE_NAME]) {
                tableConstraints[c.TABLE_NAME] = [];
            }
            tableConstraints[c.TABLE_NAME].push(c.REFERENCED_TABLE_NAME);
        });

        Object.keys(tableConstraints).forEach(table => {
            console.log(`   ${table} → ${tableConstraints[table].join(', ')}`);
        });

        console.log('\n\n✅ Analyse de la base de données terminée!');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter la vérification
checkDatabaseIntegrity();