-- Script simple pour ajouter des données de test sans déclencher les triggers

-- 1. D'abord, vérifier ce qu'on a
SELECT COUNT(*) as stocks_belair_avant FROM stocks WHERE magasin_id = 'belair-garage';
SELECT COUNT(*) as mouvements_avant FROM mouvements_stock;

-- 2. Ajouter des stocks de base seulement si vide
-- Utiliser des INSERT directs avec des valeurs fixes pour éviter les triggers
INSERT IGNORE INTO stocks (
    magasin_id, 
    produit_id, 
    quantite, 
    quantite_disponible, 
    quantite_reservee,
    derniere_entree
) VALUES
('belair-garage', 1, 150.000, 150.000, 0.000, NOW()),
('belair-garage', 2, 200.000, 200.000, 5.000, NOW()),
('belair-garage', 3, 75.000, 75.000, 0.000, NOW()),
('belair-garage', 4, 300.000, 300.000, 10.000, NOW()),
('belair-garage', 5, 120.000, 120.000, 0.000, NOW());

-- 3. Ajouter des mouvements directement sans référencer la table stocks
INSERT IGNORE INTO mouvements_stock (
    type_mouvement,
    produit_id,
    magasin_destination_id,
    quantite,
    reference_document,
    date_mouvement,
    created_by,
    description
) VALUES
('entree', 1, 'belair-garage', 50.000, 'ENT-20241121-001', '2024-01-20 10:00:00', 2, 'Entrée initiale ciment'),
('entree', 2, 'belair-garage', 100.000, 'ENT-20241121-002', '2024-01-20 11:00:00', 2, 'Entrée initiale sable'),
('entree', 3, 'belair-garage', 25.000, 'ENT-20241121-003', '2024-01-20 12:00:00', 2, 'Entrée initiale gravier'),
('sortie', 1, NULL, 10.000, 'SOR-20241121-001', '2024-01-21 09:00:00', 2, 'Sortie test ciment');

-- Ajouter la colonne manquante pour les sorties
UPDATE mouvements_stock 
SET magasin_source_id = 'belair-garage' 
WHERE type_mouvement = 'sortie' 
AND magasin_source_id IS NULL 
AND reference_document = 'SOR-20241121-001';

-- 4. Vérifier le résultat
SELECT COUNT(*) as stocks_belair_apres FROM stocks WHERE magasin_id = 'belair-garage';
SELECT COUNT(*) as mouvements_apres FROM mouvements_stock;

-- 5. Afficher les données créées
SELECT 
    s.id,
    s.produit_id,
    s.quantite_disponible,
    s.quantite_reservee,
    p.nom as produit_nom
FROM stocks s
LEFT JOIN produits p ON s.produit_id = p.id
WHERE s.magasin_id = 'belair-garage'
LIMIT 10;