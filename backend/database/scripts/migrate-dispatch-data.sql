-- Script de migration pour convertir les anciens mouvements en dispatch/entrée
USE its_maritime_stock;

-- 1. D'abord, créer une table temporaire pour stocker les correspondances
CREATE TEMPORARY TABLE IF NOT EXISTS temp_dispatch_mapping (
    navire_id INT,
    produit_id INT,
    magasin_id VARCHAR(50),
    date_dispatch TIMESTAMP,
    quantite_dispatch DECIMAL(10,2),
    dispatch_id INT,
    PRIMARY KEY (navire_id, produit_id, magasin_id, date_dispatch)
);

-- 2. Identifier les mouvements qui devraient être des dispatches
-- (entrées créées par des managers depuis navire_dispatching)
INSERT INTO temp_dispatch_mapping (navire_id, produit_id, magasin_id, date_dispatch, quantite_dispatch)
SELECT DISTINCT
    nd.navire_id,
    nc.produit_id,
    nd.magasin_id,
    nd.date_dispatching,
    nd.quantite
FROM navire_dispatching nd
JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
WHERE nd.date_dispatching >= DATE_SUB(NOW(), INTERVAL 3 MONTH); -- Limiter aux 3 derniers mois

-- 3. Créer les mouvements de type 'dispatch' s'ils n'existent pas déjà
INSERT INTO mouvements_stock (
    type_mouvement, 
    produit_id, 
    magasin_destination_id,
    quantite, 
    reference_document, 
    navire_id,
    date_mouvement, 
    description, 
    created_by
)
SELECT 
    'dispatch',
    nc.produit_id,
    nd.magasin_id,
    nd.quantite,
    CONCAT('DISP-MIG-', nd.id),
    nd.navire_id,
    nd.date_dispatching,
    CONCAT('Dispatch migré - ', p.nom, ' - Navire: ', n.nom_navire),
    nd.dispatch_par
FROM navire_dispatching nd
JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
JOIN navires n ON nd.navire_id = n.id
JOIN produits p ON nc.produit_id = p.id
LEFT JOIN mouvements_stock ms ON 
    ms.navire_id = nd.navire_id 
    AND ms.produit_id = nc.produit_id 
    AND ms.magasin_destination_id = nd.magasin_id
    AND ms.type_mouvement = 'dispatch'
    AND DATE(ms.date_mouvement) = DATE(nd.date_dispatching)
WHERE ms.id IS NULL
AND nd.date_dispatching >= DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- 4. Mettre à jour le dispatch_id dans les mouvements d'entrée existants
UPDATE mouvements_stock me
JOIN temp_dispatch_mapping tdm ON 
    me.navire_id = tdm.navire_id 
    AND me.produit_id = tdm.produit_id 
    AND me.magasin_destination_id = tdm.magasin_id
JOIN mouvements_stock md ON 
    md.navire_id = tdm.navire_id 
    AND md.produit_id = tdm.produit_id 
    AND md.magasin_destination_id = tdm.magasin_id
    AND md.type_mouvement = 'dispatch'
    AND DATE(md.date_mouvement) = DATE(tdm.date_dispatch)
SET me.dispatch_id = md.id
WHERE me.type_mouvement = 'entree'
AND me.date_mouvement >= tdm.date_dispatch
AND me.dispatch_id IS NULL;

-- 5. Afficher un résumé de la migration
SELECT 
    'Résumé de la migration' as Description,
    COUNT(DISTINCT CASE WHEN type_mouvement = 'dispatch' THEN id END) as 'Dispatches créés',
    COUNT(DISTINCT CASE WHEN type_mouvement = 'entree' AND dispatch_id IS NOT NULL THEN id END) as 'Entrées liées',
    COUNT(DISTINCT navire_id) as 'Navires concernés',
    COUNT(DISTINCT magasin_destination_id) as 'Magasins concernés'
FROM mouvements_stock
WHERE date_mouvement >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
AND (type_mouvement = 'dispatch' OR (type_mouvement = 'entree' AND dispatch_id IS NOT NULL));

-- 6. Nettoyer
DROP TEMPORARY TABLE IF EXISTS temp_dispatch_mapping;

-- 7. Vérifier les dispatches sans entrées correspondantes (en attente)
SELECT 
    d.date_mouvement as 'Date Dispatch',
    n.nom_navire as 'Navire',
    p.nom as 'Produit',
    m.nom as 'Magasin',
    d.quantite as 'Quantité',
    d.reference_document as 'Référence',
    'En attente de réception' as 'Statut'
FROM mouvements_stock d
LEFT JOIN mouvements_stock e ON 
    e.navire_id = d.navire_id 
    AND e.produit_id = d.produit_id
    AND e.magasin_destination_id = d.magasin_destination_id
    AND e.type_mouvement = 'entree'
    AND e.date_mouvement >= d.date_mouvement
LEFT JOIN navires n ON d.navire_id = n.id
LEFT JOIN produits p ON d.produit_id = p.id
LEFT JOIN magasins m ON d.magasin_destination_id = m.id
WHERE d.type_mouvement = 'dispatch'
AND e.id IS NULL
AND d.date_mouvement >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY d.date_mouvement DESC;