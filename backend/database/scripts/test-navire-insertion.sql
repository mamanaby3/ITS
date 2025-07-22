-- Test d'insertion dans les tables navires
USE its_maritime_stock;

-- 1. Vérifier qu'on a un utilisateur avec id=1
SELECT id, nom, prenom, role FROM utilisateurs WHERE id = 1;

-- 2. Test d'insertion d'un navire
INSERT INTO navires (
    nom_navire, 
    numero_imo, 
    date_arrivee, 
    port,
    numero_connaissement, 
    agent_maritime, 
    statut,
    date_reception, 
    reception_par, 
    observations
) VALUES (
    'Test Navire SQL', 
    'IMO-TEST-001', 
    '2025-01-28', 
    'Port de Dakar',
    'BL-TEST-001', 
    'Agent Test', 
    'receptionne',
    NOW(), 
    1, 
    'Test insertion SQL'
);

-- 3. Récupérer l'ID du navire inséré
SET @navire_id = LAST_INSERT_ID();
SELECT @navire_id as navire_id;

-- 4. Vérifier si le produit Soja existe
SELECT id, nom, reference FROM produits WHERE nom = 'Soja';

-- 5. Si pas de produit Soja, en créer un
INSERT INTO produits (reference, nom, categorie, unite, prix_tonne)
SELECT 'PROD-SOJA-TEST', 'Soja', 'cereales', 'tonnes', 0
WHERE NOT EXISTS (SELECT 1 FROM produits WHERE nom = 'Soja');

-- 6. Récupérer l'ID du produit
SELECT @produit_id := id FROM produits WHERE nom = 'Soja';

-- 7. Insérer la cargaison
INSERT INTO navire_cargaison (
    navire_id, 
    produit_id, 
    quantite_declaree, 
    quantite_recue,
    unite, 
    origine
) VALUES (
    @navire_id, 
    @produit_id, 
    7000, 
    7000,
    'tonnes', 
    'Suisse'
);

-- 8. Vérifier les insertions
SELECT 'Navire inséré:' as message, nom_navire, numero_imo, statut 
FROM navires WHERE id = @navire_id;

SELECT 'Cargaison insérée:' as message, nc.*, p.nom as produit_nom 
FROM navire_cargaison nc 
JOIN produits p ON nc.produit_id = p.id 
WHERE nc.navire_id = @navire_id;

-- 9. Nettoyer les données de test
DELETE FROM navire_cargaison WHERE navire_id = @navire_id;
DELETE FROM navires WHERE id = @navire_id;
DELETE FROM produits WHERE reference = 'PROD-SOJA-TEST';