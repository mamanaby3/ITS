-- Fix navire_dispatching table - add missing chauffeur_nom column
USE its_maritime_stock;

-- Add chauffeur_nom column to navire_dispatching table
ALTER TABLE navire_dispatching 
ADD COLUMN IF NOT EXISTS chauffeur_nom VARCHAR(100) AFTER transporteur;

-- Verify the column was added
DESCRIBE navire_dispatching;