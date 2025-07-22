-- Nettoyer la table clients en supprimant les colonnes en double
USE its_maritime_stock;

-- Supprimer les colonnes en double (garder celles utilisées par le contrôleur)
ALTER TABLE clients 
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS credit_limit,
DROP COLUMN IF EXISTS credit_utilise;

-- Vérifier la structure finale
DESCRIBE clients;

-- Afficher quelques enregistrements
SELECT id, code, nom, type_client, actif, credit_limite, encours_credit FROM clients LIMIT 5;