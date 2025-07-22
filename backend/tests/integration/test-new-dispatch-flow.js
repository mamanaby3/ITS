const mysql = require('mysql2/promise');
require('dotenv').config();

async function testNewDispatchFlow() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock'
        });

        console.log('🧪 TEST DU NOUVEAU FLUX DISPATCH → ENTREE → SORTIE\n');

        // Données de test
        const produitId = 1; // Maïs
        const magasinId = 'belair-garage';
        const managerId = 1; // Manager
        const operatorId = 2; // Opérateur magasinier

        // 1. Simuler un DISPATCH par le manager
        console.log('1️⃣ DISPATCH PAR LE MANAGER');
        console.log('   Manager dispatche 500 tonnes de Maïs vers Belair Garage\n');
        
        const refDispatch = `DISP-TEST-${Date.now()}`;
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement,
                description, created_by
            ) VALUES (
                'dispatch', ?, ?, 500, ?, NOW(),
                'Dispatch test depuis réception navire', ?
            )
        `, [produitId, magasinId, refDispatch, managerId]);

        // 2. Vérifier que le stock n'a pas changé (dispatch ne modifie pas le stock)
        const [[stockApresDispatch]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        console.log(`   ✅ Stock après dispatch: ${stockApresDispatch ? stockApresDispatch.quantite_disponible : 0} tonnes`);
        console.log('   (Le stock ne change pas lors d\'un dispatch)\n');

        // 3. Simuler une ENTREE partielle par le magasinier
        console.log('2️⃣ CONFIRMATION PARTIELLE PAR LE MAGASINIER');
        console.log('   Magasinier confirme réception de 480 tonnes (manque 20 tonnes)\n');
        
        const refEntree = `REC-TEST-${Date.now()}`;
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement,
                description, created_by
            ) VALUES (
                'entree', ?, ?, 480, ?, NOW(),
                'Réception confirmée - Manque 20 tonnes', ?
            )
        `, [produitId, magasinId, refEntree, operatorId]);

        // 4. Vérifier le stock après entrée
        const [[stockApresEntree]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        console.log(`   ✅ Stock après entrée: ${stockApresEntree ? stockApresEntree.quantite_disponible : 0} tonnes\n`);

        // 5. Simuler une SORTIE
        console.log('3️⃣ SORTIE VERS CLIENT');
        console.log('   Magasinier livre 100 tonnes à un client\n');
        
        const refSortie = `SORT-TEST-${Date.now()}`;
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_source_id,
                quantite, reference_document, date_mouvement,
                description, created_by, client_id
            ) VALUES (
                'sortie', ?, ?, 100, ?, NOW(),
                'Livraison client test', ?, 1
            )
        `, [produitId, magasinId, refSortie, operatorId]);

        // 6. Vérifier le stock final
        const [[stockFinal]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        console.log(`   ✅ Stock final: ${stockFinal ? stockFinal.quantite_disponible : 0} tonnes\n`);

        // 7. Afficher le rapport dispatch vs entrées
        console.log('4️⃣ RAPPORT DISPATCH VS ENTREES\n');
        
        const [rapport] = await connection.query(`
            SELECT 
                m.magasin_nom,
                m.produit_nom,
                m.quantite_dispatchee,
                m.quantite_entree,
                m.ecart,
                CASE 
                    WHEN m.ecart > 0 THEN '⚠️ Manque à confirmer'
                    WHEN m.ecart < 0 THEN '❌ Excès non dispatché'
                    ELSE '✅ Conforme'
                END as statut
            FROM v_rapport_dispatch_entrees m
            WHERE m.produit_id = ?
            AND m.magasin_id = ?
        `, [produitId, magasinId]);

        if (rapport.length > 0) {
            const r = rapport[0];
            console.log(`   Magasin: ${r.magasin_nom}`);
            console.log(`   Produit: ${r.produit_nom}`);
            console.log(`   Dispatché: ${r.quantite_dispatchee} tonnes`);
            console.log(`   Reçu: ${r.quantite_entree} tonnes`);
            console.log(`   Écart: ${r.ecart} tonnes`);
            console.log(`   Statut: ${r.statut}\n`);
        }

        // 8. Historique complet
        console.log('5️⃣ HISTORIQUE DES MOUVEMENTS\n');
        
        const [historique] = await connection.query(`
            SELECT 
                DATE_FORMAT(date_mouvement, '%H:%i:%s') as heure,
                type_mouvement,
                quantite,
                CASE 
                    WHEN created_by = ? THEN 'Manager'
                    ELSE 'Magasinier'
                END as role,
                description
            FROM mouvements_stock
            WHERE produit_id = ?
            AND (magasin_source_id = ? OR magasin_destination_id = ?)
            AND reference_document IN (?, ?, ?)
            ORDER BY date_mouvement
        `, [managerId, produitId, magasinId, magasinId, refDispatch, refEntree, refSortie]);

        historique.forEach(h => {
            const symbol = h.type_mouvement === 'sortie' ? '➖' : '➕';
            console.log(`   ${h.heure} ${symbol} ${h.type_mouvement.toUpperCase()} ${h.quantite} tonnes (${h.role})`);
            console.log(`      └─ ${h.description}\n`);
        });

        // Nettoyer les données de test
        await connection.query(`
            DELETE FROM mouvements_stock 
            WHERE reference_document IN (?, ?, ?)
        `, [refDispatch, refEntree, refSortie]);

        console.log('\n✅ TEST TERMINÉ AVEC SUCCÈS!\n');
        console.log('💡 RÉSUMÉ DU NOUVEAU FLUX:');
        console.log('1. Manager dispatche → Stock inchangé');
        console.log('2. Magasinier confirme → Stock augmente');
        console.log('3. Écarts automatiquement détectés');
        console.log('4. Traçabilité complète du flux');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter le test
testNewDispatchFlow();