const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyStockSystem() {
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

        console.log('🔍 VÉRIFICATION COMPLÈTE DU SYSTÈME DE STOCKS\n');

        // 1. Vérifier les stocks actuels
        console.log('📊 STOCKS ACTUELS PAR MAGASIN:\n');
        const [stocks] = await connection.query(`
            SELECT 
                m.nom as magasin,
                p.nom as produit,
                ROUND(s.quantite_disponible, 2) as quantite,
                p.unite
            FROM stocks s
            JOIN magasins m ON s.magasin_id = m.id
            JOIN produits p ON s.produit_id = p.id
            WHERE s.quantite_disponible > 0
            ORDER BY m.nom, p.nom
        `);

        let currentMagasin = '';
        stocks.forEach(s => {
            if (s.magasin !== currentMagasin) {
                console.log(`\n${s.magasin}:`);
                currentMagasin = s.magasin;
            }
            console.log(`   - ${s.produit}: ${s.quantite} ${s.unite}`);
        });

        // 2. Test complet du système
        console.log('\n\n🧪 TEST COMPLET DU SYSTÈME:\n');
        
        // Sélectionner un produit et magasin pour le test
        const [[testData]] = await connection.query(`
            SELECT 
                p.id as produit_id,
                p.nom as produit_nom,
                p.unite,
                m.id as magasin_id,
                m.nom as magasin_nom
            FROM produits p
            CROSS JOIN magasins m
            WHERE m.id = 'belair-garage'
            AND p.reference = 'MAIS-001'
        `);

        console.log(`Produit test: ${testData.produit_nom}`);
        console.log(`Magasin test: ${testData.magasin_nom}\n`);

        // Stock initial
        let [[stockBefore]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [testData.produit_id, testData.magasin_id]
        );
        const quantiteBefore = stockBefore ? parseFloat(stockBefore.quantite_disponible) : 0;
        console.log(`Stock initial: ${quantiteBefore} ${testData.unite}`);

        // Test 1: Entrée de stock
        console.log('\n➕ Test entrée de 50 tonnes...');
        const refEntree = `TEST-ENTREE-${Date.now()}`;
        
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement,
                description, created_by
            ) VALUES (
                'entree', ?, ?, 50, ?, NOW(),
                'Test système - Entrée', 1
            )
        `, [testData.produit_id, testData.magasin_id, refEntree]);

        // Vérifier le stock après entrée
        [[stockAfterEntry]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [testData.produit_id, testData.magasin_id]
        );
        const quantiteAfterEntry = stockAfterEntry ? parseFloat(stockAfterEntry.quantite_disponible) : 0;
        console.log(`Stock après entrée: ${quantiteAfterEntry} ${testData.unite}`);
        console.log(`Différence attendue: +50, Différence réelle: +${quantiteAfterEntry - quantiteBefore}`);
        
        const entrySuccess = (quantiteAfterEntry - quantiteBefore) === 50;
        console.log(entrySuccess ? '✅ Entrée fonctionnelle' : '❌ Problème avec l\'entrée');

        // Test 2: Sortie de stock
        console.log('\n➖ Test sortie de 20 tonnes...');
        const refSortie = `TEST-SORTIE-${Date.now()}`;
        
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_source_id,
                quantite, reference_document, date_mouvement,
                description, created_by
            ) VALUES (
                'sortie', ?, ?, 20, ?, NOW(),
                'Test système - Sortie', 1
            )
        `, [testData.produit_id, testData.magasin_id, refSortie]);

        // Vérifier le stock après sortie
        [[stockAfterExit]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [testData.produit_id, testData.magasin_id]
        );
        const quantiteAfterExit = stockAfterExit ? parseFloat(stockAfterExit.quantite_disponible) : 0;
        console.log(`Stock après sortie: ${quantiteAfterExit} ${testData.unite}`);
        console.log(`Différence attendue: -20, Différence réelle: ${quantiteAfterExit - quantiteAfterEntry}`);
        
        const exitSuccess = (quantiteAfterEntry - quantiteAfterExit) === 20;
        console.log(exitSuccess ? '✅ Sortie fonctionnelle' : '❌ Problème avec la sortie');

        // Nettoyer les mouvements de test
        await connection.query(
            'DELETE FROM mouvements_stock WHERE reference_document IN (?, ?)',
            [refEntree, refSortie]
        );

        // 3. Vérifier la cohérence des données
        console.log('\n\n🔍 VÉRIFICATION DE LA COHÉRENCE:\n');
        
        // Comparer les stocks calculés vs stocks réels
        const [coherence] = await connection.query(`
            SELECT 
                p.nom as produit,
                m.nom as magasin,
                COALESCE(s.quantite_disponible, 0) as stock_actuel,
                COALESCE(
                    SUM(CASE 
                        WHEN mv.type_mouvement = 'entree' THEN mv.quantite
                        WHEN mv.type_mouvement = 'sortie' THEN -mv.quantite
                        ELSE 0
                    END), 0
                ) as stock_calcule
            FROM produits p
            CROSS JOIN magasins m
            LEFT JOIN stocks s ON s.produit_id = p.id AND s.magasin_id = m.id
            LEFT JOIN mouvements_stock mv ON 
                mv.produit_id = p.id AND 
                (
                    (mv.type_mouvement = 'entree' AND mv.magasin_destination_id = m.id) OR
                    (mv.type_mouvement = 'sortie' AND mv.magasin_source_id = m.id)
                )
            GROUP BY p.id, m.id, p.nom, m.nom, s.quantite_disponible
            HAVING stock_actuel != stock_calcule OR stock_actuel > 0
        `);

        if (coherence.length === 0) {
            console.log('✅ Tous les stocks sont cohérents avec les mouvements');
        } else {
            console.log('⚠️ Incohérences détectées:');
            coherence.forEach(c => {
                console.log(`   ${c.produit} @ ${c.magasin}: Stock=${c.stock_actuel}, Calculé=${c.stock_calcule}`);
            });
        }

        // 4. Résumé final
        console.log('\n\n📋 RÉSUMÉ DU SYSTÈME:');
        console.log(entrySuccess && exitSuccess ? 
            '✅ Le système de gestion des stocks fonctionne correctement!' : 
            '⚠️ Des problèmes ont été détectés dans le système'
        );
        
        // Statistiques globales
        const [[stats]] = await connection.query(`
            SELECT 
                COUNT(DISTINCT s.produit_id) as nb_produits_stockes,
                COUNT(DISTINCT s.magasin_id) as nb_magasins_actifs,
                ROUND(SUM(s.quantite_disponible), 2) as stock_total,
                (SELECT COUNT(*) FROM mouvements_stock WHERE DATE(date_mouvement) = CURDATE()) as mouvements_aujourdhui
            FROM stocks s
            WHERE s.quantite_disponible > 0
        `);

        console.log(`\n📊 Statistiques globales:`);
        console.log(`   - Produits en stock: ${stats.nb_produits_stockes}`);
        console.log(`   - Magasins actifs: ${stats.nb_magasins_actifs}`);
        console.log(`   - Stock total: ${stats.stock_total} tonnes`);
        console.log(`   - Mouvements aujourd'hui: ${stats.mouvements_aujourdhui}`);

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter la vérification
verifyStockSystem();