-- Création de la table stocks pour simplifier la gestion
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

-- Trigger pour mettre à jour le stock lors d'un dispatch (entrée)
DELIMITER $$
CREATE TRIGGER after_dispatch_insert
AFTER INSERT ON navire_dispatching
FOR EACH ROW
BEGIN
    DECLARE produit_id_value INT;
    
    -- Récupérer le produit_id depuis navire_cargaison
    SELECT nc.produit_id INTO produit_id_value
    FROM navire_cargaison nc
    WHERE nc.id = NEW.cargaison_id;
    
    -- Insérer ou mettre à jour le stock
    INSERT INTO stocks (magasin_id, produit_id, quantite_actuelle, quantite_entrees, derniere_entree)
    VALUES (NEW.magasin_id, produit_id_value, NEW.quantite, NEW.quantite, NEW.date_dispatching)
    ON DUPLICATE KEY UPDATE
        quantite_actuelle = quantite_actuelle + NEW.quantite,
        quantite_entrees = quantite_entrees + NEW.quantite,
        derniere_entree = NEW.date_dispatching;
END$$

-- Trigger pour mettre à jour le stock lors d'une livraison (sortie)
CREATE TRIGGER after_livraison_insert
AFTER INSERT ON livraisons
FOR EACH ROW
BEGIN
    -- Seulement si la livraison est confirmée et qu'il y a un magasin
    IF NEW.statut IN ('livree', 'confirmee') AND NEW.magasin_id IS NOT NULL THEN
        -- Mettre à jour le stock
        UPDATE stocks 
        SET 
            quantite_actuelle = quantite_actuelle - NEW.quantite,
            quantite_sorties = quantite_sorties + NEW.quantite,
            derniere_sortie = NEW.date_livraison
        WHERE magasin_id = NEW.magasin_id AND produit_id = NEW.produit_id;
    END IF;
END$$

-- Trigger pour gérer les changements de statut de livraison
CREATE TRIGGER after_livraison_update
AFTER UPDATE ON livraisons
FOR EACH ROW
BEGIN
    -- Si le statut change vers 'livree' ou 'confirmee'
    IF OLD.statut NOT IN ('livree', 'confirmee') 
       AND NEW.statut IN ('livree', 'confirmee') 
       AND NEW.magasin_id IS NOT NULL THEN
        -- Déduire du stock
        UPDATE stocks 
        SET 
            quantite_actuelle = quantite_actuelle - NEW.quantite,
            quantite_sorties = quantite_sorties + NEW.quantite,
            derniere_sortie = NEW.date_livraison
        WHERE magasin_id = NEW.magasin_id AND produit_id = NEW.produit_id;
    
    -- Si le statut change depuis 'livree' ou 'confirmee' vers autre chose
    ELSEIF OLD.statut IN ('livree', 'confirmee') 
           AND NEW.statut NOT IN ('livree', 'confirmee') 
           AND NEW.magasin_id IS NOT NULL THEN
        -- Rajouter au stock
        UPDATE stocks 
        SET 
            quantite_actuelle = quantite_actuelle + NEW.quantite,
            quantite_sorties = quantite_sorties - NEW.quantite
        WHERE magasin_id = NEW.magasin_id AND produit_id = NEW.produit_id;
    END IF;
END$$

DELIMITER ;

-- Migration des données existantes
INSERT INTO stocks (magasin_id, produit_id, quantite_entrees, quantite_sorties, quantite_actuelle, derniere_entree, derniere_sortie)
SELECT 
    nd.magasin_id,
    nc.produit_id,
    COALESCE(SUM(nd.quantite), 0) as quantite_entrees,
    COALESCE((
        SELECT SUM(l.quantite) 
        FROM livraisons l 
        WHERE l.magasin_id = nd.magasin_id 
        AND l.produit_id = nc.produit_id
        AND l.statut IN ('livree', 'confirmee')
    ), 0) as quantite_sorties,
    COALESCE(SUM(nd.quantite), 0) - COALESCE((
        SELECT SUM(l.quantite) 
        FROM livraisons l 
        WHERE l.magasin_id = nd.magasin_id 
        AND l.produit_id = nc.produit_id
        AND l.statut IN ('livree', 'confirmee')
    ), 0) as quantite_actuelle,
    MAX(nd.date_dispatching) as derniere_entree,
    (
        SELECT MAX(l.date_livraison) 
        FROM livraisons l 
        WHERE l.magasin_id = nd.magasin_id 
        AND l.produit_id = nc.produit_id
        AND l.statut IN ('livree', 'confirmee')
    ) as derniere_sortie
FROM navire_dispatching nd
JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
WHERE nd.magasin_id IS NOT NULL
GROUP BY nd.magasin_id, nc.produit_id
ON DUPLICATE KEY UPDATE
    quantite_entrees = VALUES(quantite_entrees),
    quantite_sorties = VALUES(quantite_sorties),
    quantite_actuelle = VALUES(quantite_actuelle),
    derniere_entree = VALUES(derniere_entree),
    derniere_sortie = VALUES(derniere_sortie);

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_stocks_complets AS
SELECT 
    s.*,
    m.nom as magasin_nom,
    p.nom as produit_nom,
    p.reference as produit_reference,
    p.categorie as produit_categorie,
    p.unite as produit_unite
FROM stocks s
JOIN magasins m ON s.magasin_id = m.id
JOIN produits p ON s.produit_id = p.id;