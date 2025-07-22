const mysql = require('mysql2/promise');
require('dotenv').config();

async function addDispatchType() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'its_maritime_stock',
            multipleStatements: true
        });

        console.log('🔧 AJOUT DU TYPE DISPATCH AU SYSTÈME\n');

        // 1. Vérifier la structure actuelle
        console.log('1️⃣ Vérification de la structure actuelle...');
        const [columnInfo] = await connection.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'mouvements_stock' 
            AND COLUMN_NAME = 'type_mouvement'
        `, [process.env.DB_NAME || 'its_maritime_stock']);

        console.log('Types actuels:', columnInfo[0].COLUMN_TYPE);

        // 2. Modifier l'enum pour ajouter 'dispatch'
        console.log('\n2️⃣ Ajout du type "dispatch" à la colonne type_mouvement...');
        
        await connection.query(`
            ALTER TABLE mouvements_stock 
            MODIFY COLUMN type_mouvement 
            ENUM('entree', 'sortie', 'transfert', 'ajustement', 'dispatch') NOT NULL
        `);
        
        console.log('✅ Type "dispatch" ajouté avec succès!');

        // 3. Mettre à jour le trigger pour gérer les dispatches
        console.log('\n3️⃣ Mise à jour du trigger pour gérer les dispatches...');
        
        await connection.query('DROP TRIGGER IF EXISTS after_mouvement_stock_insert');
        
        const createTriggerSQL = `
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    -- Pour les dispatches (depuis le manager vers les magasins)
    IF NEW.type_mouvement = 'dispatch' AND NEW.magasin_destination_id IS NOT NULL THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite;
    
    -- Pour les entrées de stock (confirmées par le magasinier)
    ELSEIF NEW.type_mouvement = 'entree' AND NEW.magasin_destination_id IS NOT NULL THEN
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
        console.log('✅ Trigger mis à jour!');

        // 4. Créer une vue pour le rapport dispatch vs entrées
        console.log('\n4️⃣ Création de la vue pour le rapport comparatif...');
        
        await connection.query('DROP VIEW IF EXISTS v_rapport_dispatch_entrees');
        
        await connection.query(`
            CREATE VIEW v_rapport_dispatch_entrees AS
            SELECT 
                p.id as produit_id,
                p.nom as produit_nom,
                p.reference as produit_reference,
                m.id as magasin_id,
                m.nom as magasin_nom,
                -- Quantités dispatchées par le manager
                COALESCE(SUM(CASE 
                    WHEN mv.type_mouvement = 'dispatch' 
                    THEN mv.quantite 
                    ELSE 0 
                END), 0) as quantite_dispatchee,
                -- Quantités entrées confirmées par le magasinier
                COALESCE(SUM(CASE 
                    WHEN mv.type_mouvement = 'entree' 
                    THEN mv.quantite 
                    ELSE 0 
                END), 0) as quantite_entree,
                -- Différence (écart)
                COALESCE(SUM(CASE 
                    WHEN mv.type_mouvement = 'dispatch' 
                    THEN mv.quantite 
                    ELSE 0 
                END), 0) - COALESCE(SUM(CASE 
                    WHEN mv.type_mouvement = 'entree' 
                    THEN mv.quantite 
                    ELSE 0 
                END), 0) as ecart,
                -- Dates
                MAX(CASE 
                    WHEN mv.type_mouvement = 'dispatch' 
                    THEN mv.date_mouvement 
                END) as derniere_date_dispatch,
                MAX(CASE 
                    WHEN mv.type_mouvement = 'entree' 
                    THEN mv.date_mouvement 
                END) as derniere_date_entree
            FROM produits p
            CROSS JOIN magasins m
            LEFT JOIN mouvements_stock mv ON 
                mv.produit_id = p.id 
                AND mv.magasin_destination_id = m.id
                AND mv.type_mouvement IN ('dispatch', 'entree')
            GROUP BY p.id, p.nom, p.reference, m.id, m.nom
            HAVING quantite_dispatchee > 0 OR quantite_entree > 0
        `);
        
        console.log('✅ Vue de rapport créée!');

        // 5. Créer une procédure pour convertir les anciennes entrées en dispatches
        console.log('\n5️⃣ Création de la procédure de conversion...');
        
        await connection.query('DROP PROCEDURE IF EXISTS sp_convertir_entrees_navire_en_dispatch');
        
        await connection.query(`
            CREATE PROCEDURE sp_convertir_entrees_navire_en_dispatch()
            BEGIN
                -- Convertir les entrées liées à un navire en dispatches
                UPDATE mouvements_stock 
                SET type_mouvement = 'dispatch'
                WHERE type_mouvement = 'entree' 
                AND navire_id IS NOT NULL
                AND created_by IN (
                    SELECT id FROM utilisateurs WHERE role = 'manager'
                );
                
                SELECT ROW_COUNT() as nb_conversions;
            END
        `);
        
        console.log('✅ Procédure créée!');

        // 6. Exemple de requête pour le rapport
        console.log('\n6️⃣ Test du rapport dispatch vs entrées...\n');
        
        const [rapport] = await connection.query(`
            SELECT 
                magasin_nom,
                produit_nom,
                quantite_dispatchee,
                quantite_entree,
                ecart,
                CASE 
                    WHEN ecart > 0 THEN 'Manque à confirmer'
                    WHEN ecart < 0 THEN 'Excès non dispatché'
                    ELSE 'OK'
                END as statut
            FROM v_rapport_dispatch_entrees
            WHERE ecart != 0
            ORDER BY magasin_nom, produit_nom
            LIMIT 10
        `);

        if (rapport.length > 0) {
            console.log('📊 Écarts détectés:');
            rapport.forEach(r => {
                console.log(`   ${r.magasin_nom} - ${r.produit_nom}: ${r.ecart} (${r.statut})`);
            });
        } else {
            console.log('✅ Aucun écart détecté entre dispatches et entrées');
        }

        // 7. Résumé
        console.log('\n\n✅ SYSTÈME MIS À JOUR AVEC SUCCÈS!\n');
        console.log('📋 Nouveau flux de travail:');
        console.log('1. Manager: Fait un DISPATCH depuis la réception navire');
        console.log('2. Magasinier: Confirme la réception par une ENTRÉE');
        console.log('3. Magasinier: Fait des SORTIES pour les livraisons clients');
        console.log('4. Manager: Peut voir les écarts dispatch/entrée dans les rapports');
        
        console.log('\n💡 Avantages:');
        console.log('- Traçabilité complète du flux');
        console.log('- Détection des écarts automatique');
        console.log('- Responsabilités clairement séparées');
        console.log('- Rapports précis pour le contrôle');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter la mise à jour
addDispatchType();