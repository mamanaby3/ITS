-- Corriger les procédures stockées pour utiliser la bonne table 'stocks'

USE its_maritime_stock;

-- Supprimer les procédures existantes
DROP PROCEDURE IF EXISTS enregistrer_entree_stock;
DROP PROCEDURE IF EXISTS enregistrer_sortie_stock;

-- Procédure pour enregistrer une entrée
DELIMITER //
CREATE PROCEDURE enregistrer_entree_stock(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10, 2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date DATE DEFAULT CURDATE();
    
    -- S'assurer que l'enregistrement du jour existe
    CALL initialiser_stock_jour(p_magasin_id, v_date);
    
    -- Mettre à jour les entrées
    UPDATE stock_magasinier
    SET entrees = entrees + p_quantite,
        updated_at = NOW()
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Mettre à jour aussi la table stocks principale
    INSERT INTO stocks (produit_id, magasin_id, quantite_disponible, derniere_entree)
    VALUES (p_produit_id, p_magasin_id, p_quantite, NOW())
    ON DUPLICATE KEY UPDATE 
        quantite_disponible = quantite_disponible + p_quantite,
        derniere_entree = NOW();
END//
DELIMITER ;

-- Procédure pour enregistrer une sortie
DELIMITER //
CREATE PROCEDURE enregistrer_sortie_stock(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10, 2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date DATE DEFAULT CURDATE();
    DECLARE v_stock_disponible DECIMAL(10, 2);
    
    -- S'assurer que l'enregistrement du jour existe
    CALL initialiser_stock_jour(p_magasin_id, v_date);
    
    -- Vérifier le stock disponible
    SELECT (stock_initial + entrees + quantite_dispatchee - sorties) INTO v_stock_disponible
    FROM stock_magasinier
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    IF v_stock_disponible < p_quantite THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuffisant pour cette sortie';
    END IF;
    
    -- Mettre à jour les sorties
    UPDATE stock_magasinier
    SET sorties = sorties + p_quantite,
        updated_at = NOW()
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Mettre à jour aussi la table stocks principale
    UPDATE stocks
    SET quantite_disponible = quantite_disponible - p_quantite,
        derniere_sortie = NOW()
    WHERE magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
END//
DELIMITER ;

-- Ajouter une contrainte unique sur la table stocks si elle n'existe pas
ALTER TABLE stocks 
ADD CONSTRAINT unique_stock_magasin_produit 
UNIQUE (magasin_id, produit_id);