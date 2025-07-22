-- Update passwords for all test users to 'admin123'
-- Password hash: $2a$10$dF5e9nhgTpz8JjKxvQ8BVOiC.qVFD0WKlU28j6.vMX9pEGdbtfsIu

-- First ensure admin@its-sn.com exists and is active
INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif)
SELECT 'admin@its-sn.com', '$2a$10$dF5e9nhgTpz8JjKxvQ8BVOiC.qVFD0WKlU28j6.vMX9pEGdbtfsIu', 'Admin', 'ITS', 'manager', 
       (SELECT id FROM magasins LIMIT 1), 1
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@its-sn.com');

-- Update password for admin@its-sn.com
UPDATE utilisateurs 
SET password = '$2a$10$dF5e9nhgTpz8JjKxvQ8BVOiC.qVFD0WKlU28j6.vMX9pEGdbtfsIu',
    actif = 1
WHERE email = 'admin@its-sn.com';

-- Update password for other test users
UPDATE utilisateurs 
SET password = '$2a$10$dF5e9nhgTpz8JjKxvQ8BVOiC.qVFD0WKlU28j6.vMX9pEGdbtfsIu',
    actif = 1
WHERE email IN ('admin@its.sn', 'manager@its.sn', 'test@its.sn', 'manager@its-sn.com');

-- Also update users table if needed
UPDATE users 
SET password_hash = '$2a$10$dF5e9nhgTpz8JjKxvQ8BVOiC.qVFD0WKlU28j6.vMX9pEGdbtfsIu'
WHERE email IN ('admin@its-sn.com', 'admin@its.sn', 'manager@its.sn', 'manager@its-sn.com');

-- Show active users
SELECT email, nom, role, actif FROM utilisateurs WHERE actif = 1;