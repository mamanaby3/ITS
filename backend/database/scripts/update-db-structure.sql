-- Mise à jour de la structure de la base de données
USE its_maritime_stock;

-- Modifier la colonne role pour inclure 'admin'
ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'manager', 'operator') NOT NULL;

-- Mettre à jour l'utilisateur admin
UPDATE utilisateurs SET role = 'admin' WHERE email = 'admin@its-senegal.com';

-- Ajouter des routes clients si manquantes
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Sénégal',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    credit_utilise DECIMAL(12,2) DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ajouter quelques clients de test
INSERT IGNORE INTO clients (code, nom, email, telephone, ville) VALUES
('CLI-001', 'Société Import Export SA', 'contact@importexport.sn', '+221 33 123 45 67', 'Dakar'),
('CLI-002', 'Groupe Agricole du Sénégal', 'info@gas.sn', '+221 33 234 56 78', 'Thiès'),
('CLI-003', 'Distribution Nationale SARL', 'contact@distnat.sn', '+221 33 345 67 89', 'Saint-Louis');