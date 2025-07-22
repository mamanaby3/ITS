@echo off
echo Applying permissions fix to database...
cd C:\Users\HP\CascadeProjects\GESTION_STOCK_ITS_SN\backend\scripts
mysql -u root its_maritime_stock < add-permissions-column.sql
echo Done! Permissions column added and roles updated.
pause