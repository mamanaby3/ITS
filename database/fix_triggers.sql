-- =====================================================
-- CORRECTION DES TRIGGERS POUR XAMPP/MySQL
-- =====================================================

USE its_senegal_stock;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS after_dispatch_to_magasin;
DROP TRIGGER IF EXISTS after_livraison;

-- Trigger pour mettre à jour le stock après un dispatching vers magasin
DELIMITER $$
CREATE TRIGGER after_dispatch_to_magasin
AFTER INSERT ON navire_dispatching
FOR EACH ROW
BEGIN
    DECLARE v_produit_id INT;
    
    IF NEW.type_destination = 'magasin' AND NEW.statut = 'confirme' THEN
        -- Récupérer le produit_id depuis la cargaison
        SELECT produit_id INTO v_produit_id 
        FROM navire_cargaisons 
        WHERE id = NEW.cargaison_id;
        
        -- Mettre à jour ou insérer dans stock_magasin
        INSERT INTO stock_magasin (magasin_id, produit_id, quantite_disponible)
        VALUES (NEW.magasin_id, v_produit_id, NEW.quantite)
        ON DUPLICATE KEY UPDATE 
        quantite_disponible = quantite_disponible + NEW.quantite;
        
        -- Enregistrer le mouvement
        INSERT INTO mouvements_stock (
            type_mouvement, magasin_id, produit_id, quantite,
            reference_document, navire_id, created_by
        ) VALUES (
            'entree', NEW.magasin_id, v_produit_id, NEW.quantite,
            CONCAT('DISPATCH-', NEW.id), NEW.navire_id, NEW.dispatch_par
        );
    END IF;
END$$
DELIMITER ;

-- Trigger pour mettre à jour le stock après une livraison
DELIMITER $$
CREATE TRIGGER after_livraison
AFTER UPDATE ON livraisons
FOR EACH ROW
BEGIN
    IF NEW.statut = 'livre' AND OLD.statut != 'livre' THEN
        -- Diminuer le stock
        UPDATE stock_magasin 
        SET quantite_disponible = quantite_disponible - NEW.quantite
        WHERE magasin_id = NEW.magasin_id 
        AND produit_id = NEW.produit_id;
        
        -- Enregistrer le mouvement
        INSERT INTO mouvements_stock (
            type_mouvement, magasin_id, produit_id, quantite,
            reference_document, livraison_id, created_by
        ) VALUES (
            'sortie', NEW.magasin_id, NEW.produit_id, NEW.quantite,
            NEW.reference, NEW.id, NEW.created_by
        );
    END IF;
END$$
DELIMITER ;

-- Message de confirmation
SELECT 'Triggers créés avec succès!' AS Message;