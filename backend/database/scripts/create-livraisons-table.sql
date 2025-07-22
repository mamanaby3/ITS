-- Create livraisons table
USE its_maritime_stock;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS livraisons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    date_livraison DATE NOT NULL,
    client_id INT,
    magasin_id VARCHAR(50),
    transporteur VARCHAR(255),
    numero_camion VARCHAR(100),
    chauffeur VARCHAR(255),
    permis_chauffeur VARCHAR(100),
    telephone_chauffeur VARCHAR(50),
    numero_bon_livraison VARCHAR(100),
    destination VARCHAR(255),
    statut ENUM('programmee', 'en_cours', 'livre', 'annulee') DEFAULT 'en_cours',
    observations TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES utilisateurs(id)
);