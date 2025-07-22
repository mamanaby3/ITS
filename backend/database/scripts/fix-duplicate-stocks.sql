-- Corriger les doublons dans la table stocks avant d'ajouter la contrainte unique

USE its_maritime_stock;

-- Créer une table temporaire pour consolider les stocks
CREATE TEMPORARY TABLE temp_stocks AS
SELECT 
    produit_id,
    magasin_id,
    SUM(quantite_disponible) as quantite_disponible,
    SUM(quantite_reservee) as quantite_reservee,
    AVG(valeur_unitaire) as valeur_unitaire,
    MAX(lot_number) as lot_number,
    MIN(date_entree) as date_entree,
    MAX(date_expiration) as date_expiration,
    MAX(emplacement) as emplacement,
    MAX(derniere_entree) as derniere_entree,
    MAX(derniere_sortie) as derniere_sortie,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM stocks
GROUP BY produit_id, magasin_id;

-- Supprimer tous les enregistrements de la table stocks
DELETE FROM stocks;

-- Réinsérer les données consolidées
INSERT INTO stocks (
    produit_id, magasin_id, quantite_disponible, quantite_reservee, 
    valeur_unitaire, lot_number, date_entree, date_expiration, 
    emplacement, derniere_entree, derniere_sortie, created_at, updated_at
)
SELECT 
    produit_id, magasin_id, quantite_disponible, quantite_reservee,
    valeur_unitaire, lot_number, date_entree, date_expiration,
    emplacement, derniere_entree, derniere_sortie, created_at, updated_at
FROM temp_stocks;

-- Maintenant ajouter la contrainte unique
ALTER TABLE stocks 
ADD CONSTRAINT unique_stock_magasin_produit 
UNIQUE (magasin_id, produit_id);

-- Vérifier le résultat
SELECT 
    magasin_id, 
    produit_id, 
    COUNT(*) as nombre_lignes,
    SUM(quantite_disponible) as quantite_totale
FROM stocks 
GROUP BY magasin_id, produit_id
ORDER BY magasin_id, produit_id;