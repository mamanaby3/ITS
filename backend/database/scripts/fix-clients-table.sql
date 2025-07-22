-- Script pour corriger la table clients
USE its_maritime_stock;

-- Supprimer la table si elle existe avec une mauvaise structure
DROP TABLE IF EXISTS clients;

-- Créer la table clients avec la bonne structure
CREATE TABLE clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type_client ENUM('entreprise', 'particulier', 'gouvernement', 'ong') DEFAULT 'entreprise',
    email VARCHAR(100),
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(50),
    pays VARCHAR(50) DEFAULT 'Sénégal',
    credit_limite DECIMAL(15,2) DEFAULT 0,
    encours_credit DECIMAL(15,2) DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nom_client (nom),
    INDEX idx_code_client (code)
);

-- Insérer quelques clients de test
INSERT INTO clients (code, nom, email, telephone, ville, pays) VALUES
('CLI-001', 'Client Test 1', 'test1@example.com', '338651234', 'Dakar', 'Sénégal'),
('CLI-002', 'Client Test 2', 'test2@example.com', '338655678', 'Thiès', 'Sénégal');

-- Vérifier que la table a été créée
SELECT COUNT(*) as total_clients FROM clients;