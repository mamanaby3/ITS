const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixStockSystem() {
    let connection;
    
    try {
        // Connexion à la base de données
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock',
            multipleStatements: true
        });

        console.log('🔧 CORRECTION DU SYSTÈME DE STOCKS\n');

        // 1. Vérifier et corriger les doublons
        console.log('1️⃣ Recherche des doublons dans la table stocks...');
        const [duplicates] = await connection.query(`
            SELECT produit_id, magasin_id, COUNT(*) as count
            FROM stocks
            GROUP BY produit_id, magasin_id
            HAVING COUNT(*) > 1
        `);

        if (duplicates.length > 0) {
            console.log(`   ⚠️ ${duplicates.length} doublons trouvés`);
            
            // Sauvegarder les stocks corrects avant correction
            console.log('   📦 Calcul des stocks corrects...');
            await connection.query(`
                CREATE TEMPORARY TABLE stocks_corrects AS
                SELECT 
                    produit_id,
                    magasin_id,
                    SUM(quantite_disponible) as quantite_totale
                FROM stocks
                GROUP BY produit_id, magasin_id
            `);
            
            // Supprimer tous les stocks
            console.log('   🗑️ Suppression des doublons...');
            await connection.query('TRUNCATE TABLE stocks');
            
            // Réinsérer les stocks corrects
            console.log('   ✅ Réinsertion des stocks consolidés...');
            await connection.query(`
                INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
                SELECT produit_id, magasin_id, quantite_totale
                FROM stocks_corrects
                WHERE quantite_totale > 0
            `);
            
            await connection.query('DROP TEMPORARY TABLE stocks_corrects');
            console.log('   ✅ Doublons corrigés!\n');
        } else {
            console.log('   ✅ Aucun doublon trouvé\n');
        }

        // 2. Vérifier la contrainte unique
        console.log('2️⃣ Vérification de la contrainte unique...');
        const [constraints] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'stocks'
            AND CONSTRAINT_TYPE = 'UNIQUE'
        `, [process.env.DB_NAME || 'its_maritime_stock']);

        const hasUniqueConstraint = constraints.some(c => 
            c.CONSTRAINT_NAME.includes('produit') && c.CONSTRAINT_NAME.includes('magasin')
        );

        if (!hasUniqueConstraint) {
            console.log('   ⚠️ Contrainte unique manquante');
            console.log('   🔧 Ajout de la contrainte unique...');
            
            try {
                await connection.query(`
                    ALTER TABLE stocks 
                    ADD UNIQUE KEY unique_produit_magasin (produit_id, magasin_id)
                `);
                console.log('   ✅ Contrainte unique ajoutée!\n');
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log('   ✅ La contrainte existe déjà\n');
                } else {
                    throw err;
                }
            }
        } else {
            console.log('   ✅ Contrainte unique déjà présente\n');
        }

        // 3. Recalculer tous les stocks basés sur les mouvements
        console.log('3️⃣ Recalcul complet des stocks basés sur les mouvements...');
        
        // Vider et recalculer
        await connection.query('TRUNCATE TABLE stocks');
        
        const insertStocksQuery = `
            INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
            SELECT 
                produit_id,
                magasin_id,
                SUM(quantite) as quantite_totale
            FROM (
                -- Entrées
                SELECT 
                    produit_id, 
                    magasin_destination_id as magasin_id,
                    quantite
                FROM mouvements_stock
                WHERE type_mouvement = 'entree' 
                AND magasin_destination_id IS NOT NULL
                
                UNION ALL
                
                -- Sorties (quantités négatives)
                SELECT 
                    produit_id, 
                    magasin_source_id as magasin_id,
                    -quantite as quantite
                FROM mouvements_stock
                WHERE type_mouvement = 'sortie' 
                AND magasin_source_id IS NOT NULL
                
                UNION ALL
                
                -- Transferts sortants (quantités négatives)
                SELECT 
                    produit_id, 
                    magasin_source_id as magasin_id,
                    -quantite as quantite
                FROM mouvements_stock
                WHERE type_mouvement = 'transfert' 
                AND magasin_source_id IS NOT NULL
                
                UNION ALL
                
                -- Transferts entrants
                SELECT 
                    produit_id, 
                    magasin_destination_id as magasin_id,
                    quantite
                FROM mouvements_stock
                WHERE type_mouvement = 'transfert' 
                AND magasin_destination_id IS NOT NULL
            ) as mouvements
            GROUP BY produit_id, magasin_id
            HAVING quantite_totale > 0
        `;
        
        await connection.query(insertStocksQuery);
        console.log('   ✅ Stocks recalculés!\n');

        // 4. Recréer le trigger corrigé
        console.log('4️⃣ Mise à jour du trigger...');
        
        // Supprimer l'ancien trigger
        await connection.query('DROP TRIGGER IF EXISTS after_mouvement_stock_insert');
        
        // Créer le nouveau trigger avec gestion des doublons
        const createTriggerSQL = `
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    -- Pour les entrées de stock
    IF NEW.type_mouvement = 'entree' AND NEW.magasin_destination_id IS NOT NULL THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite;
    
    -- Pour les sorties de stock
    ELSEIF NEW.type_mouvement = 'sortie' AND NEW.magasin_source_id IS NOT NULL THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
        VALUES (NEW.produit_id, NEW.magasin_source_id, 0)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = GREATEST(0, quantite_disponible - NEW.quantite);
    
    -- Pour les transferts entre magasins
    ELSEIF NEW.type_mouvement = 'transfert' THEN
        -- Sortie du magasin source
        IF NEW.magasin_source_id IS NOT NULL THEN
            INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
            VALUES (NEW.produit_id, NEW.magasin_source_id, 0)
            ON DUPLICATE KEY UPDATE
                quantite_disponible = GREATEST(0, quantite_disponible - NEW.quantite);
        END IF;
        
        -- Entrée dans le magasin destination
        IF NEW.magasin_destination_id IS NOT NULL THEN
            INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
            VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite)
            ON DUPLICATE KEY UPDATE
                quantite_disponible = quantite_disponible + NEW.quantite;
        END IF;
    END IF;
END`;

        await connection.query(createTriggerSQL);
        console.log('   ✅ Trigger mis à jour!\n');

        // 5. Test final
        console.log('5️⃣ Test final du système...');
        
        // Test avec un produit et magasin spécifiques
        const produitId = 1; // Maïs
        const magasinId = 'belair-garage';
        
        // Stock avant test
        const [[stockBefore]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        const quantiteBefore = stockBefore ? parseFloat(stockBefore.quantite_disponible) : 0;
        console.log(`   Stock initial: ${quantiteBefore}`);
        
        // Insérer une entrée test
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement, created_by
            ) VALUES (
                'entree', ?, ?, 25, 'FIX-TEST-ENTRY', NOW(), 1
            )
        `, [produitId, magasinId]);
        
        // Stock après entrée
        const [[stockAfter]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [produitId, magasinId]
        );
        const quantiteAfter = stockAfter ? parseFloat(stockAfter.quantite_disponible) : 0;
        console.log(`   Stock après entrée (+25): ${quantiteAfter}`);
        
        const success = (quantiteAfter - quantiteBefore) === 25;
        console.log(success ? '   ✅ Le trigger fonctionne correctement!' : '   ❌ Le trigger ne fonctionne pas');
        
        // Nettoyer le test
        await connection.query("DELETE FROM mouvements_stock WHERE reference_document = 'FIX-TEST-ENTRY'");
        
        // 6. Résumé final
        console.log('\n📊 RÉSUMÉ FINAL:\n');
        
        const [finalStocks] = await connection.query(`
            SELECT 
                m.nom as magasin,
                COUNT(DISTINCT s.produit_id) as nb_produits,
                ROUND(SUM(s.quantite_disponible), 2) as stock_total
            FROM stocks s
            JOIN magasins m ON s.magasin_id = m.id
            WHERE s.quantite_disponible > 0
            GROUP BY m.id, m.nom
            ORDER BY stock_total DESC
        `);
        
        console.log('Stocks par magasin:');
        finalStocks.forEach(s => {
            console.log(`   ${s.magasin}: ${s.nb_produits} produits, ${s.stock_total} tonnes`);
        });
        
        console.log('\n✅ Système de stocks corrigé et opérationnel!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter la correction
fixStockSystem();