@echo off
echo ========================================
echo  CORRECTION URGENTE - Table Clients
echo ========================================
echo.

cd C:\Users\HP\CascadeProjects\GESTION_STOCK_ITS_SN\backend\scripts

echo 1. Verification des tables existantes...
mysql -u root its_maritime_stock < check-tables.sql

echo.
echo 2. Creation de la table clients...
mysql -u root its_maritime_stock < fix-clients-table.sql

echo.
echo 3. Ajout des permissions si necessaire...
mysql -u root its_maritime_stock -e "ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS permissions JSON DEFAULT '[]'"

echo.
echo ========================================
echo  Correction terminee!
echo  Redemarrez le serveur backend
echo ========================================
pause