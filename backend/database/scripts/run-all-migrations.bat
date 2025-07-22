@echo off
echo ========================================
echo  Creation des tables dans MySQL
echo ========================================
echo.

cd C:\Users\HP\CascadeProjects\GESTION_STOCK_ITS_SN\backend\scripts

echo 1. Creation des tables principales...
mysql -u root its_maritime_stock < create-tables-mysql.sql

echo 2. Creation des tables manquantes...
mysql -u root its_maritime_stock < create-missing-tables.sql

echo 3. Ajout des permissions...
mysql -u root its_maritime_stock < add-permissions-column.sql

echo 4. Creation des procedures et triggers...
mysql -u root its_maritime_stock < create-procedures-triggers.sql

echo 5. Ajout des index...
mysql -u root its_maritime_stock < add-indexes.sql

echo.
echo ========================================
echo  Toutes les migrations ont ete executees!
echo ========================================
pause