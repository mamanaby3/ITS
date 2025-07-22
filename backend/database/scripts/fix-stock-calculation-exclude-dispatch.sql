-- =============================================================================
-- SCRIPT DE MIGRATION: Exclure les dispatches du calcul de stock
-- =============================================================================
-- Ce script modifie le système pour que le stock soit calculé uniquement
-- comme la somme des entrées (sans les dispatches)
-- =============================================================================

-- 1. Modifier la colonne stock_final pour exclure quantite_dispatchee
ALTER TABLE stock_magasinier 
MODIFY COLUMN stock_final DECIMAL(10, 2) 
GENERATED ALWAYS AS (stock_initial + entrees - sorties) STORED;

-- 2. Recalculer tous les stocks existants (exclure les dispatches)
UPDATE stocks s
SET quantite_disponible = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN m.type_mouvement = 'entree' THEN m.quantite
            WHEN m.type_mouvement = 'sortie' THEN -m.quantite
            WHEN m.type_mouvement = 'transfert' AND m.magasin_destination_id = s.magasin_id THEN m.quantite
            WHEN m.type_mouvement = 'transfert' AND m.magasin_source_id = s.magasin_id THEN -m.quantite
            ELSE 0
        END
    ), 0)
    FROM mouvements_stock m
    WHERE (m.magasin_destination_id = s.magasin_id OR m.magasin_source_id = s.magasin_id)
    AND m.produit_id = s.produit_id
),
updated_at = NOW();

-- 3. Réinitialiser les stocks négatifs à 0
UPDATE stocks 
SET quantite_disponible = 0 
WHERE quantite_disponible < 0;

-- 4. Afficher un résumé des stocks recalculés
SELECT 
    m.nom as magasin,
    COUNT(DISTINCT s.produit_id) as nb_produits,
    ROUND(SUM(s.quantite_disponible), 2) as stock_total,
    ROUND(AVG(s.quantite_disponible), 2) as stock_moyen
FROM stocks s
JOIN magasins m ON s.magasin_id = m.id
WHERE s.quantite_disponible > 0
GROUP BY m.id, m.nom
ORDER BY stock_total DESC;

-- 5. Vérifier les mouvements de type dispatch (pour information)
SELECT 
    'Dispatches exclus du calcul' as info,
    COUNT(*) as nombre_dispatches,
    ROUND(SUM(quantite), 2) as tonnage_total_dispatch
FROM mouvements_stock
WHERE type_mouvement = 'dispatch';

-- 6. Créer une vue pour voir l'impact des dispatches
CREATE OR REPLACE VIEW v_impact_dispatches AS
SELECT 
    m.nom as magasin,
    p.nom as produit,
    COALESCE(SUM(CASE WHEN ms.type_mouvement = 'dispatch' THEN ms.quantite ELSE 0 END), 0) as quantite_dispatch,
    s.quantite_disponible as stock_actuel,
    ROUND(
        COALESCE(SUM(CASE WHEN ms.type_mouvement = 'dispatch' THEN ms.quantite ELSE 0 END), 0) / 
        NULLIF(s.quantite_disponible, 0) * 100, 
        2
    ) as pourcentage_dispatch
FROM stocks s
JOIN magasins m ON s.magasin_id = m.id
JOIN produits p ON s.produit_id = p.id
LEFT JOIN mouvements_stock ms ON ms.produit_id = s.produit_id 
    AND (ms.magasin_destination_id = s.magasin_id OR ms.magasin_source_id = s.magasin_id)
    AND ms.type_mouvement = 'dispatch'
WHERE s.quantite_disponible > 0
GROUP BY s.id, m.id, m.nom, p.id, p.nom, s.quantite_disponible
ORDER BY quantite_dispatch DESC;

-- Message de confirmation
SELECT 
    '✅ Migration terminée' as statut,
    'Les dispatches sont maintenant exclus du calcul du stock' as message,
    'Le stock représente uniquement la somme des entrées moins les sorties' as detail;