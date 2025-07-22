-- Table pour la gestion du stock par les magasiniers
-- Cette table enregistre les mouvements journaliers: entrées, dispatches, sorties et stock final

CREATE TABLE IF NOT EXISTS stock_magasinier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_mouvement DATE NOT NULL,
    magasin_id VARCHAR(50) NOT NULL,
    produit_id INT NOT NULL,
    
    -- Stock début de journée
    stock_initial DECIMAL(10, 2) DEFAULT 0,
    
    -- Entrées (réceptions dans le magasin)
    entrees DECIMAL(10, 2) DEFAULT 0,
    
    -- Quantité dispatchée (envoyée depuis un autre magasin)
    quantite_dispatchee DECIMAL(10, 2) DEFAULT 0,
    
    -- Sorties (livraisons aux clients)
    sorties DECIMAL(10, 2) DEFAULT 0,
    
    -- Stock final calculé (dispatch exclus du calcul)
    stock_final DECIMAL(10, 2) GENERATED ALWAYS AS (stock_initial + entrees - sorties) STORED,
    
    -- Métadonnées
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id),
    
    -- Index pour améliorer les performances
    INDEX idx_date_magasin (date_mouvement, magasin_id),
    INDEX idx_produit (produit_id),
    
    -- Contrainte d'unicité: un seul enregistrement par jour/magasin/produit
    UNIQUE KEY unique_stock_jour (date_mouvement, magasin_id, produit_id)
);

-- Vue pour obtenir le stock actuel par magasin
CREATE OR REPLACE VIEW vue_stock_actuel AS
SELECT 
    sm.magasin_id,
    m.nom as magasin_nom,
    sm.produit_id,
    p.nom as produit_nom,
    p.reference as produit_reference,
    p.unite,
    sm.date_mouvement,
    sm.stock_initial,
    sm.entrees,
    sm.quantite_dispatchee,
    sm.sorties,
    sm.stock_final,
    -- Calculer le taux de rotation
    CASE 
        WHEN sm.stock_initial > 0 
        THEN ROUND((sm.sorties / sm.stock_initial) * 100, 2)
        ELSE 0 
    END as taux_rotation_pourcent
FROM stock_magasinier sm
JOIN magasins m ON sm.magasin_id = m.id
JOIN produits p ON sm.produit_id = p.id
WHERE sm.date_mouvement = (
    SELECT MAX(date_mouvement) 
    FROM stock_magasinier sm2 
    WHERE sm2.magasin_id = sm.magasin_id 
    AND sm2.produit_id = sm.produit_id
);

-- Procédure pour initialiser le stock du jour
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
            s.quantite
        ) as stock_initial,
        0 as entrees,
        0 as quantite_dispatchee,
        0 as sorties
    FROM stock s
    WHERE s.magasin_id = p_magasin_id
    ON DUPLICATE KEY UPDATE
        stock_initial = VALUES(stock_initial);
END//
DELIMITER ;

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
    UPDATE stocks
    SET quantite_disponible = quantite_disponible + p_quantite,
        derniere_entree = NOW()
    WHERE magasin_id = p_magasin_id
    AND produit_id = p_produit_id;
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
    
    -- Vérifier le stock disponible (dispatch exclus)
    SELECT (stock_initial + entrees - sorties) INTO v_stock_disponible
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