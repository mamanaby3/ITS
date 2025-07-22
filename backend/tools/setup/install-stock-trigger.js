const mysql = require('mysql2/promise');
require('dotenv').config();

async function installStockTrigger() {
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

        console.log('✅ Connexion établie à la base de données\n');

        // 1. Supprimer le trigger s'il existe déjà
        console.log('🔧 Suppression du trigger existant si présent...');
        await connection.query('DROP TRIGGER IF EXISTS after_mouvement_stock_insert');
        console.log('   ✅ Trigger supprimé (si existant)\n');

        // 2. Créer le nouveau trigger
        console.log('🔧 Création du trigger pour la mise à jour automatique des stocks...');
        
        const createTriggerSQL = `
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    -- Pour les entrées de stock
    IF NEW.type_mouvement = 'entree' THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite;
    
    -- Pour les sorties de stock
    ELSEIF NEW.type_mouvement = 'sortie' THEN
        UPDATE stocks 
        SET quantite_disponible = GREATEST(0, quantite_disponible - NEW.quantite)
        WHERE produit_id = NEW.produit_id 
        AND magasin_id = NEW.magasin_source_id;
    
    -- Pour les transferts entre magasins
    ELSEIF NEW.type_mouvement = 'transfert' THEN
        -- Sortie du magasin source
        UPDATE stocks 
        SET quantite_disponible = GREATEST(0, quantite_disponible - NEW.quantite)
        WHERE produit_id = NEW.produit_id 
        AND magasin_id = NEW.magasin_source_id;
        
        -- Entrée dans le magasin destination
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite;
    END IF;
END`;

        await connection.query(createTriggerSQL);
        console.log('   ✅ Trigger créé avec succès!\n');

        // 3. Vérifier que le trigger existe
        const [triggers] = await connection.query(`
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
            FROM INFORMATION_SCHEMA.TRIGGERS 
            WHERE TRIGGER_SCHEMA = ? 
            AND TRIGGER_NAME = 'after_mouvement_stock_insert'
        `, [process.env.DB_NAME || 'its_maritime_stock']);

        if (triggers.length > 0) {
            console.log('✅ Trigger vérifié et actif:');
            console.log(`   - Nom: ${triggers[0].TRIGGER_NAME}`);
            console.log(`   - Événement: ${triggers[0].EVENT_MANIPULATION}`);
            console.log(`   - Table: ${triggers[0].EVENT_OBJECT_TABLE}\n`);
        }

        // 4. Initialiser les stocks basés sur les mouvements existants
        console.log('📊 Initialisation des stocks basés sur les mouvements existants...\n');

        // D'abord, vider la table stocks
        await connection.query('TRUNCATE TABLE stocks');
        console.log('   ✅ Table stocks réinitialisée\n');

        // Calculer les stocks pour chaque combinaison produit/magasin
        const [stockCalculations] = await connection.query(`
            SELECT 
                produit_id,
                magasin_id,
                SUM(quantite_entree) - SUM(quantite_sortie) as quantite_totale
            FROM (
                -- Entrées
                SELECT 
                    produit_id, 
                    magasin_destination_id as magasin_id,
                    quantite as quantite_entree,
                    0 as quantite_sortie
                FROM mouvements_stock
                WHERE type_mouvement = 'entree' 
                AND magasin_destination_id IS NOT NULL
                
                UNION ALL
                
                -- Sorties
                SELECT 
                    produit_id, 
                    magasin_source_id as magasin_id,
                    0 as quantite_entree,
                    quantite as quantite_sortie
                FROM mouvements_stock
                WHERE type_mouvement = 'sortie' 
                AND magasin_source_id IS NOT NULL
                
                UNION ALL
                
                -- Transferts (sortie)
                SELECT 
                    produit_id, 
                    magasin_source_id as magasin_id,
                    0 as quantite_entree,
                    quantite as quantite_sortie
                FROM mouvements_stock
                WHERE type_mouvement = 'transfert' 
                AND magasin_source_id IS NOT NULL
                
                UNION ALL
                
                -- Transferts (entrée)
                SELECT 
                    produit_id, 
                    magasin_destination_id as magasin_id,
                    quantite as quantite_entree,
                    0 as quantite_sortie
                FROM mouvements_stock
                WHERE type_mouvement = 'transfert' 
                AND magasin_destination_id IS NOT NULL
            ) as mouvements_calcules
            GROUP BY produit_id, magasin_id
            HAVING quantite_totale > 0
        `);

        console.log(`   📦 ${stockCalculations.length} combinaisons produit/magasin trouvées\n`);

        // Insérer les stocks calculés
        for (const stock of stockCalculations) {
            await connection.query(`
                INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
                VALUES (?, ?, ?)
            `, [stock.produit_id, stock.magasin_id, Math.max(0, stock.quantite_totale)]);
        }

        console.log('   ✅ Stocks initialisés avec succès!\n');

        // 5. Afficher un résumé des stocks
        const [stockSummary] = await connection.query(`
            SELECT 
                m.nom as magasin,
                COUNT(DISTINCT s.produit_id) as nb_produits,
                ROUND(SUM(s.quantite_disponible), 2) as stock_total
            FROM stocks s
            JOIN magasins m ON s.magasin_id = m.id
            WHERE s.quantite_disponible > 0
            GROUP BY m.id, m.nom
            ORDER BY m.nom
        `);

        console.log('📊 Résumé des stocks par magasin:');
        stockSummary.forEach(s => {
            console.log(`   - ${s.magasin}: ${s.nb_produits} produits, ${s.stock_total} tonnes`);
        });

        // 6. Test rapide du trigger
        console.log('\n🧪 Test du trigger avec une entrée fictive...');
        
        // Récupérer un produit et un magasin pour le test
        const [[testProduit]] = await connection.query('SELECT id FROM produits LIMIT 1');
        const [[testMagasin]] = await connection.query('SELECT id FROM magasins LIMIT 1');
        
        // Stock avant
        const [[stockAvant]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [testProduit.id, testMagasin.id]
        );
        const quantiteAvant = stockAvant ? stockAvant.quantite_disponible : 0;
        
        // Insérer un mouvement test
        await connection.query(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id,
                quantite, reference_document, date_mouvement, created_by
            ) VALUES (
                'entree', ?, ?, 10, 'TEST-TRIGGER', NOW(), 1
            )
        `, [testProduit.id, testMagasin.id]);
        
        // Stock après
        const [[stockApres]] = await connection.query(
            'SELECT quantite_disponible FROM stocks WHERE produit_id = ? AND magasin_id = ?',
            [testProduit.id, testMagasin.id]
        );
        const quantiteApres = stockApres ? stockApres.quantite_disponible : 0;
        
        console.log(`   Stock avant: ${quantiteAvant}`);
        console.log(`   Stock après: ${quantiteApres}`);
        console.log(`   Différence: +${quantiteApres - quantiteAvant}`);
        
        if (quantiteApres - quantiteAvant === 10) {
            console.log('   ✅ Le trigger fonctionne correctement!');
        } else {
            console.log('   ⚠️ Le trigger ne semble pas fonctionner correctement');
        }

        // Supprimer le mouvement test
        await connection.query(
            "DELETE FROM mouvements_stock WHERE reference_document = 'TEST-TRIGGER'"
        );
        
        console.log('\n✅ Installation et initialisation terminées avec succès!');
        console.log('\n💡 Le système de gestion des stocks est maintenant totalement fonctionnel:');
        console.log('   - Les entrées augmentent automatiquement le stock');
        console.log('   - Les sorties diminuent automatiquement le stock');
        console.log('   - Les transferts déplacent le stock entre magasins');
        console.log('   - Tous les stocks actuels ont été calculés');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Détails:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter l'installation
installStockTrigger();