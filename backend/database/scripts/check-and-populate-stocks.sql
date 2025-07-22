-- Script pour vérifier les données dans la table stocks existante
-- et ajouter des données de test si nécessaire

-- 1. Vérifier les données existantes dans stocks
SELECT 'Données dans stocks:' as info;
SELECT COUNT(*) as total_stocks FROM stocks;
SELECT COUNT(*) as stocks_magasin_belair FROM stocks WHERE magasin_id = 'belair-garage';

-- 2. Voir les données existantes pour belair-garage
SELECT 
    s.*,
    p.nom as produit_nom,
    p.reference
FROM stocks s
LEFT JOIN produits p ON s.produit_id = p.id
WHERE s.magasin_id = 'belair-garage'
LIMIT 10;

-- 3. Vérifier les magasins disponibles
SELECT 'Magasins disponibles:' as info;
SELECT id, nom FROM magasins LIMIT 5;

-- 4. Vérifier les produits disponibles
SELECT 'Produits disponibles:' as info;
SELECT id, nom, reference FROM produits WHERE actif = 1 LIMIT 5;

-- 5. Ajouter des données de test seulement si la table est vide pour ce magasin
INSERT INTO stocks (
    magasin_id, 
    produit_id, 
    quantite, 
    quantite_disponible, 
    quantite_reservee, 
    derniere_entree
)
SELECT 
    'belair-garage' as magasin_id,
    p.id as produit_id,
    FLOOR(RAND() * 500) + 50 as quantite,
    FLOOR(RAND() * 500) + 50 as quantite_disponible,
    FLOOR(RAND() * 20) as quantite_reservee,
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY as derniere_entree
FROM produits p
WHERE p.actif = 1 
AND NOT EXISTS (
    SELECT 1 FROM stocks s 
    WHERE s.magasin_id = 'belair-garage' 
    AND s.produit_id = p.id
)
LIMIT 10;

-- 6. Vérifier les mouvements_stock
SELECT 'Mouvements stock:' as info;
SELECT COUNT(*) as total_mouvements FROM mouvements_stock;
SELECT COUNT(*) as mouvements_belair FROM mouvements_stock 
WHERE magasin_destination_id = 'belair-garage' OR magasin_source_id = 'belair-garage';

-- 7. Ajouter quelques mouvements de test si nécessaire
INSERT INTO mouvements_stock (
    type_mouvement,
    produit_id,
    magasin_destination_id,
    quantite,
    reference_document,
    date_mouvement,
    created_by,
    description
)
SELECT 
    'entree' as type_mouvement,
    s.produit_id,
    'belair-garage' as magasin_destination_id,
    FLOOR(RAND() * 50) + 10 as quantite,
    CONCAT('ENT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(s.produit_id, 3, '0')) as reference_document,
    NOW() - INTERVAL FLOOR(RAND() * 7) DAY as date_mouvement,
    2 as created_by,
    'Mouvement de test' as description
FROM stocks s
WHERE s.magasin_id = 'belair-garage'
AND NOT EXISTS (
    SELECT 1 FROM mouvements_stock m 
    WHERE m.produit_id = s.produit_id 
    AND m.magasin_destination_id = 'belair-garage'
)
LIMIT 5;

-- 8. Résultat final
SELECT 'Résultat final:' as info;
SELECT COUNT(*) as stocks_belair_final FROM stocks WHERE magasin_id = 'belair-garage';
SELECT COUNT(*) as mouvements_belair_final FROM mouvements_stock 
WHERE magasin_destination_id = 'belair-garage' OR magasin_source_id = 'belair-garage';