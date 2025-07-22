-- Add permissions column to utilisateurs table
ALTER TABLE utilisateurs 
ADD COLUMN permissions JSON DEFAULT '[]' AFTER role;

-- Update role enum to include admin
ALTER TABLE utilisateurs 
MODIFY COLUMN role ENUM('admin', 'manager', 'operator') NOT NULL;

-- Grant all permissions to existing users based on their role
UPDATE utilisateurs 
SET permissions = JSON_ARRAY('clients.create', 'clients.update', 'clients.delete', 'all')
WHERE role = 'manager';

UPDATE utilisateurs 
SET permissions = JSON_ARRAY('clients.create', 'clients.update')
WHERE role = 'operator';