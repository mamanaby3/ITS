-- Procédure pour enregistrer les quantités dispatchées dans stock_magasinier
DELIMITER $$

DROP PROCEDURE IF EXISTS enregistrer_quantite_dispatchee$$

CREATE PROCEDURE enregistrer_quantite_dispatchee(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10, 2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date DATE DEFAULT CURDATE();
    
    -- S'assurer que l'enregistrement du jour existe
    CALL initialiser_stock_jour(p_magasin_id, v_date);
    
    -- Mettre à jour la quantité dispatchée
    UPDATE stock_magasinier
    SET quantite_dispatchee = quantite_dispatchee + p_quantite,
        updated_at = NOW()
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Mettre à jour aussi la table stocks principale
    INSERT INTO stocks (produit_id, magasin_id, quantite_actuelle, quantite_entrees, derniere_entree)
    VALUES (p_produit_id, p_magasin_id, p_quantite, p_quantite, NOW())
    ON DUPLICATE KEY UPDATE
        quantite_actuelle = quantite_actuelle + p_quantite,
        quantite_entrees = quantite_entrees + p_quantite,
        derniere_entree = NOW();
END$$

DELIMITER ;