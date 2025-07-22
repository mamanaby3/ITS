-- Script pour créer les procédures stockées, triggers et vues manquants
-- Base: its_maritime_stock

USE its_maritime_stock;

-- =============================================================================
-- TRIGGERS POUR LA GESTION AUTOMATIQUE DES STOCKS
-- =============================================================================

DELIMITER $$

-- Trigger pour mettre à jour le stock après un mouvement
DROP TRIGGER IF EXISTS after_mouvement_stock_insert$$
CREATE TRIGGER after_mouvement_stock_insert
AFTER INSERT ON mouvements_stock
FOR EACH ROW
BEGIN
    IF NEW.type_mouvement = 'entree' THEN
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (NEW.produit_id, NEW.magasin_origine_id, NEW.quantite, NEW.date_mouvement)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NEW.date_mouvement;
    
    ELSEIF NEW.type_mouvement = 'sortie' THEN
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NEW.date_mouvement
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_origine_id;
    
    ELSEIF NEW.type_mouvement = 'transfert' THEN
        -- Sortie du magasin origine
        UPDATE stocks 
        SET quantite_disponible = quantite_disponible - NEW.quantite,
            derniere_sortie = NEW.date_mouvement
        WHERE produit_id = NEW.produit_id AND magasin_id = NEW.magasin_origine_id;
        
        -- Entrée dans le magasin destination
        INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
        VALUES (NEW.produit_id, NEW.magasin_destination_id, NEW.quantite, NEW.date_mouvement)
        ON DUPLICATE KEY UPDATE
            quantite_disponible = quantite_disponible + NEW.quantite,
            derniere_entree = NEW.date_mouvement;
    END IF;
END$$

DELIMITER ;

-- =============================================================================
-- VUES POUR FACILITER LES REQUÊTES
-- =============================================================================

-- Vue stock global par produit (recréer si elle existe déjà)
DROP VIEW IF EXISTS v_stock_global;
CREATE VIEW v_stock_global AS
SELECT 
    p.id AS produit_id,
    p.reference,
    p.nom AS produit_nom,
    p.categorie,
    p.unite,
    SUM(s.quantite_disponible) AS stock_total,
    SUM(s.quantite_reservee) AS reserve_total,
    COUNT(DISTINCT s.magasin_id) AS nb_magasins
FROM produits p
LEFT JOIN stocks s ON p.id = s.produit_id
GROUP BY p.id, p.reference, p.nom, p.categorie, p.unite;

-- Vue mouvements détaillés (recréer si elle existe déjà)
DROP VIEW IF EXISTS v_mouvements_details;
CREATE VIEW v_mouvements_details AS
SELECT 
    m.id,
    m.type_mouvement,
    m.date_mouvement,
    m.quantite,
    m.reference_document,
    p.nom AS produit,
    p.categorie,
    mag_orig.nom AS magasin_origine,
    mag_dest.nom AS magasin_destination,
    c.nom AS client,
    n.nom_navire,
    n.numero_imo,
    CONCAT(u.prenom, ' ', u.nom) AS operateur,
    u.role AS role_operateur,
    m.observations
FROM mouvements_stock m
JOIN produits p ON m.produit_id = p.id
JOIN magasins mag_orig ON m.magasin_origine_id = mag_orig.id
LEFT JOIN magasins mag_dest ON m.magasin_destination_id = mag_dest.id
LEFT JOIN clients c ON m.client_id = c.id
LEFT JOIN navires n ON m.navire_id = n.id
JOIN utilisateurs u ON m.created_by = u.id
ORDER BY m.date_mouvement DESC;

-- =============================================================================
-- PROCÉDURES STOCKÉES UTILES
-- =============================================================================

DELIMITER $$

-- Procédure pour créer une entrée depuis un dispatching navire
DROP PROCEDURE IF EXISTS sp_entree_depuis_navire$$
CREATE PROCEDURE sp_entree_depuis_navire(
    IN p_navire_id INT,
    IN p_cargaison_id INT,
    IN p_magasin_id VARCHAR(20),
    IN p_quantite DECIMAL(15,3),
    IN p_user_id INT
)
BEGIN
    DECLARE v_produit_id INT;
    DECLARE v_reference VARCHAR(50);
    
    -- Récupérer le produit_id depuis la cargaison
    SELECT produit_id INTO v_produit_id 
    FROM navire_cargaison 
    WHERE id = p_cargaison_id;
    
    -- Générer une référence
    SET v_reference = CONCAT('REC-NAV-', YEAR(NOW()), '-', LPAD(p_navire_id, 4, '0'));
    
    -- Créer le mouvement d'entrée
    INSERT INTO mouvements_stock (
        type_mouvement, produit_id, magasin_origine_id, 
        quantite, reference_document, navire_id, 
        date_mouvement, created_by
    ) VALUES (
        'entree', v_produit_id, p_magasin_id,
        p_quantite, v_reference, p_navire_id,
        NOW(), p_user_id
    );
    
    -- Enregistrer le dispatching
    INSERT INTO navire_dispatching (
        navire_id, cargaison_id, magasin_id,
        quantite, dispatch_par
    ) VALUES (
        p_navire_id, p_cargaison_id, p_magasin_id,
        p_quantite, p_user_id
    );
END$$

-- Procédure pour vérifier le stock disponible
DROP PROCEDURE IF EXISTS sp_verifier_stock_disponible$$
CREATE PROCEDURE sp_verifier_stock_disponible(
    IN p_produit_id INT,
    IN p_magasin_id VARCHAR(20),
    OUT p_disponible DECIMAL(15,3)
)
BEGIN
    SELECT COALESCE(quantite_disponible - quantite_reservee, 0) 
    INTO p_disponible
    FROM stocks
    WHERE produit_id = p_produit_id 
    AND magasin_id = p_magasin_id;
END$$

DELIMITER ;

-- Message de confirmation
SELECT 'Procédures, triggers et vues créés avec succès!' AS message;