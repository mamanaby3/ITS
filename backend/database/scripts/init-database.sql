-- Script pour initialiser la base de données ITS Maritime Stock

-- Supprimer la base de données si elle existe
DROP DATABASE IF EXISTS its_maritime_stock;

-- Créer la base de données
CREATE DATABASE its_maritime_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE its_maritime_stock;

-- Message de confirmation
SELECT 'Base de données its_maritime_stock créée avec succès!' AS message;