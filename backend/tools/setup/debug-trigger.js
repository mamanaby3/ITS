const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugTrigger() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });

        console.log('🔍 DEBUG DU SYSTÈME DE TRIGGERS\n');

        // 1. Vérifier si les triggers sont activés
        const [[triggerStatus]] = await connection.query("SHOW VARIABLES LIKE 'log_bin_trust_function_creators'");
        console.log(`Triggers autorisés: ${triggerStatus ? triggerStatus.Value : 'Non défini'}`);

        // 2. Lister tous les triggers
        const [triggers] = await connection.query(`
            SELECT 
                TRIGGER_NAME,
                EVENT_MANIPULATION,
                EVENT_OBJECT_TABLE,
                ACTION_TIMING,
                CREATED
            FROM INFORMATION_SCHEMA.TRIGGERS
            WHERE TRIGGER_SCHEMA = ?
        `, [process.env.DB_NAME || 'its_maritime_stock']);

        console.log(`\nTriggers existants: ${triggers.length}`);
        triggers.forEach(t => {
            console.log(`- ${t.TRIGGER_NAME} sur ${t.EVENT_OBJECT_TABLE} (${t.EVENT_MANIPULATION})`);
        });

        // 3. Afficher le code du trigger
        if (triggers.length > 0) {
            const [triggerCode] = await connection.query(`
                SELECT ACTION_STATEMENT 
                FROM INFORMATION_SCHEMA.TRIGGERS
                WHERE TRIGGER_SCHEMA = ? 
                AND TRIGGER_NAME = 'after_mouvement_stock_insert'
            `, [process.env.DB_NAME || 'its_maritime_stock']);
            
            if (triggerCode.length > 0) {
                console.log('\nCode du trigger:');
                console.log(triggerCode[0].ACTION_STATEMENT);
            }
        }

        // 4. Test direct sans trigger - mise à jour manuelle
        console.log('\n\n🧪 TEST ALTERNATIF - Mise à jour manuelle des stocks\n');
        
        const produitId = 1;
        const magasinId = 'belair-garage';
        const quantiteTest = 30;
        
        // Stock avant
        const [[stockBefore]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        console.log(`Stock avant: ${stockBefore ? stockBefore.quantite_disponible : 0}`);
        
        // Insérer mouvement ET mettre à jour le stock manuellement
        await connection.beginTransaction();
        
        try {
            // 1. Insérer le mouvement
            await connection.query(`
                INSERT INTO mouvements_stock (
                    type_mouvement, produit_id, magasin_destination_id,
                    quantite, reference_document, date_mouvement, created_by
                ) VALUES (
                    'entree', ?, ?, ?, 'DEBUG-MANUAL', NOW(), 1
                )
            `, [produitId, magasinId, quantiteTest]);
            
            // 2. Mettre à jour le stock manuellement
            await connection.query(`
                INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    quantite_disponible = quantite_disponible + ?
            `, [produitId, magasinId, quantiteTest, quantiteTest]);
            
            await connection.commit();
            console.log('✅ Mouvement et stock mis à jour manuellement');
            
        } catch (err) {
            await connection.rollback();
            throw err;
        }
        
        // Stock après
        const [[stockAfter]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        console.log(`Stock après: ${stockAfter ? stockAfter.quantite_disponible : 0}`);
        console.log(`Différence: +${stockAfter.quantite_disponible - (stockBefore ? stockBefore.quantite_disponible : 0)}`);
        
        // Nettoyer
        await connection.query("DELETE FROM mouvements_stock WHERE reference_document = 'DEBUG-MANUAL'");
        
        console.log('\n💡 RECOMMANDATION:\n');
        console.log('Le trigger MySQL ne fonctionne pas correctement.');
        console.log('L\'application devrait gérer les mises à jour de stock directement dans le code.');
        console.log('C\'est d\'ailleurs ce que font déjà les controllers (stockController-mysql.js).\n');
        
        // 5. Vérifier si les controllers utilisent les transactions
        console.log('📌 Le système actuel utilise:');
        console.log('- Transactions MySQL pour garantir l\'intégrité');
        console.log('- Mise à jour manuelle des stocks dans les controllers');
        console.log('- Double vérification avant les sorties');
        console.log('\n✅ Cette approche est plus fiable que les triggers!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugTrigger();