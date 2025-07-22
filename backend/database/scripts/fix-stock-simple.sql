-- Script SQL simplifié pour corriger uniquement les procédures stockées
-- Sans référencer des tables qui n'existent pas encore

DELIMITER $$

-- Supprimer les procédures existantes
DROP PROCEDURE IF EXISTS initialiser_stock_jour$$
DROP PROCEDURE IF EXISTS enregistrer_entree_stock$$
DROP PROCEDURE IF EXISTS enregistrer_sortie_stock$$

-- Procédure simplifiée pour initialiser le stock du jour
-- Utilise uniquement la table stock_magasinier
CREATE PROCEDURE initialiser_stock_jour(
    IN p_magasin_id VARCHAR(50),
    IN p_date_jour DATE
)
BEGIN
    -- Pour l'instant, on initialise juste la table stock_magasinier
    -- avec les produits existants dans la base
    INSERT INTO stock_magasinier (
        magasin_id,
        produit_id,
        date_mouvement,
        stock_initial,
        entrees,
        sorties,
        quantite_dispatchee,
        stock_final
    )
    SELECT 
        p_magasin_id,
        p.id,
        p_date_jour,
        0,
        0,
        0,
        0,
        0
    FROM produits p
    WHERE NOT EXISTS (
        SELECT 1 FROM stock_magasinier sm
        WHERE sm.magasin_id = p_magasin_id
        AND sm.produit_id = p.id
        AND sm.date_mouvement = p_date_jour
    );
END$$

-- Procédure pour enregistrer une entrée
CREATE PROCEDURE enregistrer_entree_stock(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date_jour DATE;
    SET v_date_jour = CURDATE();
    
    -- Mettre à jour ou créer l'entrée dans stock_magasinier
    INSERT INTO stock_magasinier (
        magasin_id,
        produit_id,
        date_mouvement,
        stock_initial,
        entrees,
        sorties,
        quantite_dispatchee,
        stock_final
    )
    VALUES (
        p_magasin_id,
        p_produit_id,
        v_date_jour,
        0,
        p_quantite,
        0,
        0,
        p_quantite
    )
    ON DUPLICATE KEY UPDATE
        entrees = entrees + p_quantite,
        stock_final = stock_initial + entrees + quantite_dispatchee - sorties;
    
    -- IMPORTANT: Enregistrer dans mouvements_stock
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
    VALUES (
        'entree',
        p_produit_id,
        p_magasin_id,
        p_quantite,
        CONCAT('ENT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
        NOW(),
        p_user_id,
        'Entrée confirmée par magasinier'
    );
END$$

-- Procédure pour enregistrer une sortie
CREATE PROCEDURE enregistrer_sortie_stock(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date_jour DATE;
    DECLARE v_stock_final DECIMAL(10,2);
    SET v_date_jour = CURDATE();
    
    -- Vérifier le stock final disponible dans stock_magasinier
    SELECT COALESCE(stock_final, 0) INTO v_stock_final
    FROM stock_magasinier
    WHERE magasin_id = p_magasin_id 
    AND produit_id = p_produit_id 
    AND date_mouvement = v_date_jour;
    
    IF v_stock_final IS NULL OR v_stock_final < p_quantite THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuffisant pour cette sortie';
    END IF;
    
    -- Mettre à jour stock_magasinier
    INSERT INTO stock_magasinier (
        magasin_id,
        produit_id,
        date_mouvement,
        stock_initial,
        entrees,
        sorties,
        quantite_dispatchee,
        stock_final
    )
    VALUES (
        p_magasin_id,
        p_produit_id,
        v_date_jour,
        0,
        0,
        p_quantite,
        0,
        -p_quantite
    )
    ON DUPLICATE KEY UPDATE
        sorties = sorties + p_quantite,
        stock_final = stock_initial + entrees + quantite_dispatchee - sorties;
    
    -- IMPORTANT: Enregistrer dans mouvements_stock
    INSERT INTO mouvements_stock (
        type_mouvement,
        produit_id,
        magasin_source_id,
        quantite,
        reference_document,
        date_mouvement,
        created_by,
        description
    )
    VALUES (
        'sortie',
        p_produit_id,
        p_magasin_id,
        p_quantite,
        CONCAT('SOR-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')),
        NOW(),
        p_user_id,
        'Sortie confirmée par magasinier'
    );
END$$

DELIMITER ;