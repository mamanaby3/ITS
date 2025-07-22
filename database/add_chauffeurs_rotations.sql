-- =====================================================
-- AJOUT DES TABLES CHAUFFEURS ET ROTATIONS
-- =====================================================

USE its_senegal_stock;

-- Table des chauffeurs
CREATE TABLE IF NOT EXISTS chauffeurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    matricule VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    permis_numero VARCHAR(50),
    permis_categorie VARCHAR(10) DEFAULT 'B',
    date_embauche DATE,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    immatriculation VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    type_vehicule ENUM('camion', 'semi-remorque', 'plateau', 'benne') DEFAULT 'camion',
    capacite_tonnes DECIMAL(10,2),
    annee INT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des rotations (livraisons par camion)
CREATE TABLE IF NOT EXISTS rotations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(50) UNIQUE NOT NULL,
    date_rotation DATE NOT NULL,
    chauffeur_id INT NOT NULL,
    vehicule_id INT NOT NULL,
    magasin_id INT NOT NULL,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    heure_depart TIME,
    heure_retour TIME,
    kilometrage_depart INT,
    kilometrage_retour INT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id),
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);

-- Table détails des rotations (plusieurs livraisons par rotation)
CREATE TABLE IF NOT EXISTS rotation_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rotation_id INT NOT NULL,
    livraison_id INT NOT NULL,
    ordre_livraison INT DEFAULT 1,
    heure_arrivee_client TIME,
    heure_depart_client TIME,
    signature_client VARCHAR(100),
    quantite_livree DECIMAL(15,3),
    quantite_retour DECIMAL(15,3) DEFAULT 0,
    motif_retour TEXT,
    observations TEXT,
    FOREIGN KEY (rotation_id) REFERENCES rotations(id),
    FOREIGN KEY (livraison_id) REFERENCES livraisons(id)
);

-- Table des incidents/problèmes pendant les rotations
CREATE TABLE IF NOT EXISTS rotation_incidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rotation_id INT NOT NULL,
    type_incident ENUM('accident', 'panne', 'retard', 'vol', 'autre') NOT NULL,
    description TEXT NOT NULL,
    heure_incident TIME,
    lieu VARCHAR(200),
    actions_prises TEXT,
    cout_estime DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rotation_id) REFERENCES rotations(id)
);

-- =====================================================
-- DONNÉES DE BASE
-- =====================================================

-- Insérer des chauffeurs
INSERT INTO chauffeurs (matricule, nom, prenom, telephone, permis_numero, permis_categorie) VALUES
('CHAUF001', 'GUEYE', 'Babacar', '+221 77 123 45 67', 'DK2018-12345', 'C'),
('CHAUF002', 'KANE', 'Mamadou', '+221 77 234 56 78', 'DK2019-23456', 'C'),
('CHAUF003', 'THIAM', 'Alioune', '+221 77 345 67 89', 'DK2017-34567', 'EC'),
('CHAUF004', 'DIOUF', 'Papa', '+221 77 456 78 90', 'DK2020-45678', 'C'),
('CHAUF005', 'FAYE', 'Moustapha', '+221 77 567 89 01', 'DK2019-56789', 'EC'),
('CHAUF006', 'NDOYE', 'Ibrahima', '+221 77 678 90 12', 'DK2018-67890', 'C'),
('CHAUF007', 'MBAYE', 'Serigne', '+221 77 789 01 23', 'DK2021-78901', 'C'),
('CHAUF008', 'WADE', 'Assane', '+221 77 890 12 34', 'DK2020-89012', 'EC'),
('CHAUF009', 'SENE', 'Malick', '+221 77 901 23 45', 'DK2019-90123', 'C'),
('CHAUF010', 'DIAGNE', 'Fallou', '+221 77 012 34 56', 'DK2018-01234', 'EC');

-- Insérer des véhicules
INSERT INTO vehicules (immatriculation, marque, modele, type_vehicule, capacite_tonnes) VALUES
('DK-1234-AB', 'Mercedes', 'Actros', 'semi-remorque', 30.00),
('DK-2345-BC', 'Volvo', 'FH16', 'semi-remorque', 35.00),
('DK-3456-CD', 'MAN', 'TGX', 'camion', 20.00),
('DK-4567-DE', 'Renault', 'T480', 'semi-remorque', 32.00),
('DK-5678-EF', 'Iveco', 'Stralis', 'camion', 18.00),
('DK-6789-FG', 'Scania', 'R450', 'semi-remorque', 33.00),
('DK-7890-GH', 'DAF', 'XF105', 'plateau', 25.00),
('DK-8901-HI', 'Mercedes', 'Atego', 'camion', 15.00),
('DK-9012-IJ', 'MAN', 'TGS', 'benne', 22.00),
('DK-0123-JK', 'Volvo', 'FM', 'camion', 20.00);

-- =====================================================
-- VUES UTILES POUR LES ROTATIONS
-- =====================================================

-- Vue des rotations du jour
CREATE VIEW v_rotations_jour AS
SELECT 
    r.reference,
    r.date_rotation,
    CONCAT(c.prenom, ' ', c.nom) as chauffeur,
    v.immatriculation,
    m.nom as magasin_depart,
    r.statut,
    r.heure_depart,
    r.heure_retour,
    COUNT(DISTINCT rd.livraison_id) as nombre_livraisons,
    SUM(rd.quantite_livree) as total_livre
FROM rotations r
JOIN chauffeurs c ON r.chauffeur_id = c.id
JOIN vehicules v ON r.vehicule_id = v.id
JOIN magasins m ON r.magasin_id = m.id
LEFT JOIN rotation_details rd ON r.id = rd.rotation_id
WHERE r.date_rotation = CURDATE()
GROUP BY r.id
ORDER BY r.heure_depart;

-- Vue des performances chauffeurs
CREATE VIEW v_performance_chauffeurs AS
SELECT 
    c.matricule,
    CONCAT(c.prenom, ' ', c.nom) as chauffeur,
    COUNT(DISTINCT r.id) as nombre_rotations,
    COUNT(DISTINCT rd.livraison_id) as nombre_livraisons,
    SUM(rd.quantite_livree) as total_livre_tonnes,
    AVG(TIME_TO_SEC(TIMEDIFF(r.heure_retour, r.heure_depart))/3600) as duree_moyenne_heures,
    COUNT(DISTINCT ri.id) as nombre_incidents
FROM chauffeurs c
LEFT JOIN rotations r ON c.id = r.chauffeur_id AND r.statut = 'termine'
LEFT JOIN rotation_details rd ON r.id = rd.rotation_id
LEFT JOIN rotation_incidents ri ON r.id = ri.rotation_id
GROUP BY c.id
ORDER BY total_livre_tonnes DESC;

-- =====================================================
-- PROCÉDURES POUR LA GESTION DES ROTATIONS
-- =====================================================

DELIMITER $$

-- Procédure pour créer une rotation avec ses livraisons
CREATE PROCEDURE sp_creer_rotation(
    IN p_chauffeur_id INT,
    IN p_vehicule_id INT,
    IN p_magasin_id INT,
    IN p_date_rotation DATE,
    IN p_created_by INT
)
BEGIN
    DECLARE v_reference VARCHAR(50);
    DECLARE v_rotation_id INT;
    
    -- Générer la référence
    SET v_reference = CONCAT('ROT-', DATE_FORMAT(p_date_rotation, '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 1000), 3, '0'));
    
    -- Créer la rotation
    INSERT INTO rotations (
        reference, date_rotation, chauffeur_id, vehicule_id, 
        magasin_id, statut, created_by
    ) VALUES (
        v_reference, p_date_rotation, p_chauffeur_id, p_vehicule_id,
        p_magasin_id, 'planifie', p_created_by
    );
    
    SET v_rotation_id = LAST_INSERT_ID();
    
    -- Retourner les détails de la rotation créée
    SELECT 
        r.*,
        CONCAT(c.prenom, ' ', c.nom) as chauffeur_nom,
        v.immatriculation,
        m.nom as magasin_nom
    FROM rotations r
    JOIN chauffeurs c ON r.chauffeur_id = c.id
    JOIN vehicules v ON r.vehicule_id = v.id
    JOIN magasins m ON r.magasin_id = m.id
    WHERE r.id = v_rotation_id;
END$$

-- Procédure pour vérifier la disponibilité d'un véhicule
CREATE PROCEDURE sp_check_vehicule_disponible(
    IN p_vehicule_id INT,
    IN p_date DATE,
    OUT p_disponible BOOLEAN
)
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM rotations
    WHERE vehicule_id = p_vehicule_id
    AND date_rotation = p_date
    AND statut IN ('planifie', 'en_cours');
    
    SET p_disponible = IF(v_count = 0, TRUE, FALSE);
END$$

DELIMITER ;

-- =====================================================
-- TRIGGERS POUR LES ROTATIONS
-- =====================================================

DELIMITER $$

-- Trigger pour mettre à jour le statut de livraison quand une rotation est terminée
CREATE TRIGGER after_rotation_termine
AFTER UPDATE ON rotations
FOR EACH ROW
BEGIN
    IF NEW.statut = 'termine' AND OLD.statut != 'termine' THEN
        -- Mettre à jour toutes les livraisons de cette rotation
        UPDATE livraisons l
        JOIN rotation_details rd ON l.id = rd.livraison_id
        SET l.statut = 'livre'
        WHERE rd.rotation_id = NEW.id
        AND l.statut = 'en_cours';
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PERMISSIONS ADDITIONNELLES
-- =====================================================

-- Permettre aux chefs de magasin de gérer les rotations
-- (Les permissions réelles dépendent de votre système d'authentification)

-- Message de confirmation
SELECT 'Tables chauffeurs et rotations créées avec succès!' AS Message;