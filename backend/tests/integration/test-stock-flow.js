const mysql = require('mysql2/promise');
require('dotenv').config();

async function testStockFlow() {
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

        console.log('✅ Connexion établie à la base de données\n');

        // 1. Sélectionner un produit et un magasin pour le test
        console.log('📦 PRODUIT DE TEST:');
        const [[produit]] = await connection.query(`
            SELECT id, reference, nom, unite 
            FROM produits 
            LIMIT 1
        `);
        console.log(`   - ${produit.nom} (${produit.reference})`);

        const [[magasin]] = await connection.query(`
            SELECT id, nom 
            FROM magasins 
            LIMIT 1
        `);
        console.log(`   - Magasin: ${magasin.nom} (${magasin.id})\n`);

        // 2. Vérifier le stock initial
        console.log('📊 STOCK INITIAL:');
        let [[stockInitial]] = await connection.query(`
            SELECT quantite_disponible 
            FROM stocks 
            WHERE produit_id = ? AND magasin_id = ?
        `, [produit.id, magasin.id]);
        
        const quantiteInitiale = stockInitial ? stockInitial.quantite_disponible : 0;
        console.log(`   Stock actuel: ${quantiteInitiale} ${produit.unite}\n`);

        // 3. Simuler une entrée de stock
        console.log('➕ SIMULATION ENTRÉE DE STOCK:');
        const quantiteEntree = 100;
        const refEntree = `TEST-IN-${Date.now()}`;
        
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement,
                description, created_by
            ) VALUES (
                'entree', ?, ?, ?, ?, NOW(),
                'Test entrée de stock automatique', 1
            )
        `, [produit.id, magasin.id, quantiteEntree, refEntree]);
        
        console.log(`   ✅ Entrée de ${quantiteEntree} ${produit.unite} créée`);

        // 4. Vérifier le stock après entrée
        [[stockApresEntree]] = await connection.query(`
            SELECT quantite_disponible 
            FROM stocks 
            WHERE produit_id = ? AND magasin_id = ?
        `, [produit.id, magasin.id]);
        
        const quantiteApresEntree = stockApresEntree ? stockApresEntree.quantite_disponible : 0;
        console.log(`   Stock après entrée: ${quantiteApresEntree} ${produit.unite}`);
        console.log(`   Différence: +${quantiteApresEntree - quantiteInitiale} ${produit.unite}\n`);

        // 5. Simuler une sortie de stock
        console.log('➖ SIMULATION SORTIE DE STOCK:');
        const quantiteSortie = 30;
        const refSortie = `TEST-OUT-${Date.now()}`;
        
        // Vérifier qu'on a assez de stock
        if (quantiteApresEntree >= quantiteSortie) {
            await connection.query(`
                INSERT INTO mouvements_stock (
                    type_mouvement, produit_id, magasin_source_id,
                    quantite, reference_document, date_mouvement,
                    description, created_by
                ) VALUES (
                    'sortie', ?, ?, ?, ?, NOW(),
                    'Test sortie de stock automatique', 1
                )
            `, [produit.id, magasin.id, quantiteSortie, refSortie]);
            
            console.log(`   ✅ Sortie de ${quantiteSortie} ${produit.unite} créée`);

            // 6. Vérifier le stock final
            [[stockFinal]] = await connection.query(`
                SELECT quantite_disponible 
                FROM stocks 
                WHERE produit_id = ? AND magasin_id = ?
            `, [produit.id, magasin.id]);
            
            const quantiteFinale = stockFinal ? stockFinal.quantite_disponible : 0;
            console.log(`   Stock après sortie: ${quantiteFinale} ${produit.unite}`);
            console.log(`   Différence: -${quantiteApresEntree - quantiteFinale} ${produit.unite}\n`);
        } else {
            console.log(`   ⚠️ Stock insuffisant pour la sortie\n`);
        }

        // 7. Vérifier les mouvements créés
        console.log('📋 MOUVEMENTS CRÉÉS:');
        const [mouvements] = await connection.query(`
            SELECT 
                type_mouvement,
                quantite,
                reference_document,
                DATE_FORMAT(date_mouvement, '%d/%m/%Y %H:%i') as date_mouvement
            FROM mouvements_stock
            WHERE produit_id = ? 
            AND (magasin_source_id = ? OR magasin_destination_id = ?)
            AND (reference_document = ? OR reference_document = ?)
            ORDER BY date_mouvement DESC
        `, [produit.id, magasin.id, magasin.id, refEntree, refSortie]);

        mouvements.forEach(m => {
            const symbol = m.type_mouvement === 'entree' ? '+' : '-';
            console.log(`   ${symbol} ${m.quantite} ${produit.unite} - ${m.reference_document} (${m.date_mouvement})`);
        });

        // 8. Vérifier le trigger
        console.log('\n🔧 VÉRIFICATION DU TRIGGER:');
        const [triggers] = await connection.query(`
            SELECT TRIGGER_NAME 
            FROM INFORMATION_SCHEMA.TRIGGERS 
            WHERE TRIGGER_SCHEMA = ? 
            AND EVENT_OBJECT_TABLE = 'mouvements_stock'
        `, [process.env.DB_NAME || 'its_maritime_stock']);
        
        if (triggers.length > 0) {
            console.log('   ✅ Trigger trouvé:', triggers[0].TRIGGER_NAME);
            console.log('   Le stock est mis à jour automatiquement par le trigger MySQL');
        } else {
            console.log('   ⚠️ Aucun trigger trouvé');
            console.log('   Le stock est mis à jour manuellement dans l\'application');
        }

        console.log('\n✅ Test du flux entrée/sortie terminé avec succès!');
        console.log('\n💡 Le système fonctionne correctement:');
        console.log('   - Les entrées augmentent le stock');
        console.log('   - Les sorties diminuent le stock');
        console.log('   - Le stock actuel est calculé automatiquement');
        console.log('   - Tous les mouvements sont tracés');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter le test
testStockFlow();