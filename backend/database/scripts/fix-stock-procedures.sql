-- Correction des procédures stockées pour utiliser la bonne table 'stocks' (avec un 's')
-- Ce script corrige l'erreur "Table 'its_maritime_stock.stock' doesn't exist"

USE its_maritime_stock;

-- Supprimer les procédures existantes
DROP PROCEDURE IF EXISTS initialiser_stock_jour;
DROP PROCEDURE IF EXISTS enregistrer_entree_stock;
DROP PROCEDURE IF EXISTS enregistrer_sortie_stock;

-- Recréer la procédure pour initialiser le stock du jour avec la bonne table
DELIMITER //
CREATE PROCEDURE initialiser_stock_jour(
    IN p_magasin_id VARCHAR(50),
    IN p_date DATE
)
BEGIN
    -- Insérer les enregistrements pour tous les produits du magasin
    -- en utilisant le stock_final de la veille comme stock_initial
    INSERT INTO stock_magasinier (date_mouvement, magasin_id, produit_id, stock_initial, entrees, quantite_dispatchee, sorties)
    SELECT 
        p_date,
        p_magasin_id,
        s.produit_id,
        COALESCE(
            (SELECT stock_final 
             FROM stock_magasinier sm 
             WHERE sm.magasin_id = p_magasin_id 
             AND sm.produit_id = s.produit_id 
             AND sm.date_mouvement = DATE_SUB(p_date, INTERVAL 1 DAY)
            ), 
            s.quantite_actuelle  -- Utiliser quantite_actuelle de la table stocks
        ) as stock_initial,
        0 as entrees,
        0 as quantite_dispatchee,
        0 as sorties
    FROM stocks s  -- Correction: utiliser 'stocks' au lieu de 'stock'
    WHERE s.magasin_id = p_magasin_id
    ON DUPLICATE KEY UPDATE
        stock_initial = VALUES(stock_initial);
END//
DELIMITER ;

-- Recréer la procédure pour enregistrer une entrée
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
    
    -- Mettre à jour les entrées dans stock_magasinier
    UPDATE stock_magasinier
    SET entrees = entrees + p_quantite,
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
        
    -- Enregistrer le mouvement dans la table mouvements_stock
    INSERT INTO mouvements_stock (type, produit_id, magasin_id, quantite, utilisateur_id, created_at)
    VALUES ('entree', p_produit_id, p_magasin_id, p_quantite, p_user_id, NOW());
END//
DELIMITER ;

-- Recréer la procédure pour enregistrer une sortie
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
    DECLARE v_stock_actuel DECIMAL(10, 2);
    
    -- S'assurer que l'enregistrement du jour existe
    CALL initialiser_stock_jour(p_magasin_id, v_date);
    
    -- Vérifier le stock disponible dans stock_magasinier
    SELECT (stock_initial + entrees - sorties) INTO v_stock_disponible
    FROM stock_magasinier
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Vérifier aussi le stock actuel dans la table stocks
    SELECT quantite_actuelle INTO v_stock_actuel
    FROM stocks
    WHERE magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Utiliser le minimum des deux valeurs pour la vérification
    SET v_stock_disponible = LEAST(IFNULL(v_stock_disponible, 0), IFNULL(v_stock_actuel, 0));
    
    IF v_stock_disponible < p_quantite THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Stock insuffisant pour cette sortie';
    END IF;
    
    -- Mettre à jour les sorties dans stock_magasinier
    UPDATE stock_magasinier
    SET sorties = sorties + p_quantite,
        updated_at = NOW()
    WHERE date_mouvement = v_date
    AND magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Mettre à jour aussi la table stocks principale
    UPDATE stocks
    SET quantite_actuelle = quantite_actuelle - p_quantite,
        quantite_sorties = quantite_sorties + p_quantite,
        derniere_sortie = NOW()
    WHERE magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
    
    -- Enregistrer le mouvement dans la table mouvements_stock
    INSERT INTO mouvements_stock (type, produit_id, magasin_id, quantite, utilisateur_id, created_at)
    VALUES ('sortie', p_produit_id, p_magasin_id, p_quantite, p_user_id, NOW());
END//
DELIMITER ;

-- Ajouter une contrainte unique sur la table stocks si elle n'existe pas déjà
-- (Cette contrainte existe déjà dans create_stocks_table.sql, donc on ignore l'erreur si elle existe)
ALTER TABLE stocks 
ADD CONSTRAINT unique_stock_magasin_produit_v2 
UNIQUE (magasin_id, produit_id);