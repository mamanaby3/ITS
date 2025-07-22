-- Script pour vérifier l'existence et la structure de la table stocks

-- 1. Vérifier si la table existe
SELECT 'Table stocks existe' as status
FROM information_schema.tables 
WHERE table_schema = 'its_maritime_stock' 
AND table_name = 'stocks';

-- 2. Afficher la structure de la table stocks
DESCRIBE stocks;

-- 3. Compter le nombre d'enregistrements
SELECT COUNT(*) as nombre_enregistrements FROM stocks;

-- 4. Voir quelques exemples de données
SELECT * FROM stocks LIMIT 5;

-- 5. Vérifier les colonnes attendues par le contrôleur
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'its_maritime_stock' 
AND TABLE_NAME = 'stocks'
AND COLUMN_NAME IN ('quantite_disponible', 'quantite_reservee', 'derniere_entree', 'derniere_sortie');

-- 6. Vérifier la table mouvements_stock
SELECT 'Table mouvements_stock existe' as status
FROM information_schema.tables 
WHERE table_schema = 'its_maritime_stock' 
AND table_name = 'mouvements_stock';

-- 7. Compter les mouvements
SELECT COUNT(*) as nombre_mouvements FROM mouvements_stock;

-- 8. Voir les derniers mouvements
SELECT 
    type_mouvement,
    produit_id,
    magasin_destination_id,
    magasin_source_id,
    quantite,
    date_mouvement,
    description
FROM mouvements_stock 
ORDER BY date_mouvement DESC 
LIMIT 5;