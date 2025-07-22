-- Script pour corriger les procédures stockées
-- Utilise la table 'stock' (pas 'stocks') qui existe dans create-tables-mysql.sql

DELIMITER $$

-- Supprimer les procédures existantes
DROP PROCEDURE IF EXISTS initialiser_stock_jour$$
DROP PROCEDURE IF EXISTS enregistrer_entree_stock$$
DROP PROCEDURE IF EXISTS enregistrer_sortie_stock$$

-- Créer la procédure initialiser_stock_jour
CREATE PROCEDURE initialiser_stock_jour(
    IN p_magasin_id VARCHAR(50),
    IN p_date_jour DATE
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_produit_id INT;
    DECLARE v_stock_final DECIMAL(10,2);
    
    -- Curseur pour parcourir tous les produits ayant du stock dans ce magasin
    DECLARE produit_cursor CURSOR FOR
        SELECT DISTINCT s.produit_id
        FROM stocks s
        WHERE s.magasin_id = p_magasin_id
        AND s.quantite_actuelle > 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Ouvrir le curseur
    OPEN produit_cursor;
    
    -- Parcourir tous les produits
    read_loop: LOOP
        FETCH produit_cursor INTO v_produit_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calculer le stock final de la veille (ou stock actuel si pas d'entrée pour aujourd'hui)
        SELECT COALESCE(
            (SELECT stock_final 
             FROM stock_magasinier 
             WHERE magasin_id = p_magasin_id 
             AND produit_id = v_produit_id 
             AND date_mouvement = DATE_SUB(p_date_jour, INTERVAL 1 DAY)
            ),
            (SELECT quantite_actuelle 
             FROM stocks
             WHERE magasin_id = p_magasin_id 
             AND produit_id = v_produit_id
            ),
            0
        ) INTO v_stock_final;
        
        -- Créer l'entrée du jour si elle n'existe pas
        INSERT INTO stock_magasinier (
            magasin_id, 
            produit_id, 
            date_mouvement, 
            stock_initial,
            stock_final,
            entrees,
            sorties,
            quantite_dispatchee
        )
        VALUES (
            p_magasin_id,
            v_produit_id,
            p_date_jour,
            v_stock_final,
            v_stock_final,
            0,
            0,
            0
        )
        ON DUPLICATE KEY UPDATE
            stock_initial = v_stock_final,
            stock_final = stock_initial + entrees + quantite_dispatchee - sorties;
            
    END LOOP;
    
    -- Fermer le curseur
    CLOSE produit_cursor;
END$$

-- Créer la procédure enregistrer_entree_stock
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
    
    -- Mettre à jour le stock principal dans la table stocks
    INSERT INTO stocks (
        magasin_id,
        produit_id,
        quantite_actuelle,
        quantite_entrees,
        derniere_entree
    )
    VALUES (
        p_magasin_id,
        p_produit_id,
        p_quantite,
        p_quantite,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        quantite_actuelle = quantite_actuelle + p_quantite,
        quantite_entrees = quantite_entrees + p_quantite,
        derniere_entree = NOW();
    
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

-- Créer la procédure enregistrer_sortie_stock
CREATE PROCEDURE enregistrer_sortie_stock(
    IN p_magasin_id VARCHAR(50),
    IN p_produit_id INT,
    IN p_quantite DECIMAL(10,2),
    IN p_user_id INT
)
BEGIN
    DECLARE v_date_jour DATE;
    DECLARE v_stock_disponible DECIMAL(10,2);
    SET v_date_jour = CURDATE();
    
    -- Vérifier le stock disponible dans la table stocks
    SELECT quantite_actuelle INTO v_stock_disponible
    FROM stocks
    WHERE magasin_id = p_magasin_id AND produit_id = p_produit_id;
    
    IF v_stock_disponible IS NULL OR v_stock_disponible < p_quantite THEN
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
    
    -- Mettre à jour le stock principal dans la table stocks
    UPDATE stocks
    SET 
        quantite_actuelle = quantite_actuelle - p_quantite,
        quantite_sorties = quantite_sorties + p_quantite,
        derniere_sortie = NOW()
    WHERE magasin_id = p_magasin_id AND produit_id = p_produit_id;
    
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

-- Créer la table stocks si elle n'existe pas déjà (copie de la migration)
CREATE TABLE IF NOT EXISTS stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  magasin_id VARCHAR(50) NOT NULL,
  produit_id INT NOT NULL,
  quantite_actuelle DECIMAL(10,2) DEFAULT 0,
  quantite_entrees DECIMAL(10,2) DEFAULT 0,
  quantite_sorties DECIMAL(10,2) DEFAULT 0,
  derniere_entree DATETIME,
  derniere_sortie DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Index pour les performances
  INDEX idx_magasin_produit (magasin_id, produit_id),
  INDEX idx_magasin (magasin_id),
  INDEX idx_produit (produit_id),
  
  -- Contrainte d'unicité
  UNIQUE KEY unique_magasin_produit (magasin_id, produit_id),
  
  -- Clés étrangères
  FOREIGN KEY (magasin_id) REFERENCES magasins(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
);

-- Note: La table 'stock' n'existe pas dans la base de données actuelle
-- Les données de stock sont gérées par les tables:
-- - stocks (pour le stock global avec quantite_actuelle)
-- - stock_magasinier (pour le suivi journalier)
-- - mouvements_stock (pour l'historique des mouvements)