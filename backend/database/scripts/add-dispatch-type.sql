-- Script pour ajouter le type 'dispatch' aux mouvements de stock
USE its_maritime_stock;

-- Modifier l'ENUM type_mouvement dans la table mouvements_stock pour inclure 'dispatch'
ALTER TABLE mouvements_stock 
MODIFY COLUMN type_mouvement ENUM('dispatch', 'entree', 'sortie', 'transfert', 'ajustement', 'perte', 'retour') NOT NULL;

-- Ajouter un index sur type_mouvement et navire_id pour améliorer les performances des requêtes
CREATE INDEX idx_mouvement_type_navire ON mouvements_stock(type_mouvement, navire_id);

-- Ajouter un champ dispatch_id pour lier les entrées aux dispatches
ALTER TABLE mouvements_stock 
ADD COLUMN dispatch_id INT NULL AFTER navire_id,
ADD CONSTRAINT fk_dispatch_id FOREIGN KEY (dispatch_id) REFERENCES navire_dispatching(id) ON DELETE SET NULL;

-- Créer une vue pour faciliter le rapport dispatch vs entrées
CREATE OR REPLACE VIEW v_dispatch_vs_entrees AS
SELECT 
    d.type_mouvement,
    d.navire_id,
    d.produit_id,
    d.magasin_destination_id as magasin_id,
    d.quantite as quantite_dispatch,
    e.quantite as quantite_entree,
    (d.quantite - COALESCE(e.quantite, 0)) as ecart,
    d.date_mouvement as date_dispatch,
    e.date_mouvement as date_entree,
    d.created_by as dispatch_par,
    e.created_by as receptionne_par,
    d.reference_document as reference_dispatch,
    e.reference_document as reference_entree,
    n.nom_navire,
    p.nom as produit_nom,
    m.nom as magasin_nom
FROM mouvements_stock d
LEFT JOIN mouvements_stock e ON 
    e.dispatch_id = d.dispatch_id 
    AND e.type_mouvement = 'entree'
    AND e.produit_id = d.produit_id
    AND e.magasin_destination_id = d.magasin_destination_id
LEFT JOIN navires n ON d.navire_id = n.id
LEFT JOIN produits p ON d.produit_id = p.id
LEFT JOIN magasins m ON d.magasin_destination_id = m.id
WHERE d.type_mouvement = 'dispatch';

-- Afficher les modifications
DESCRIBE mouvements_stock;