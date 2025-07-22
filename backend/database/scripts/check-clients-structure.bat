@echo off
echo ========================================
echo  Verification et correction table clients
echo ========================================
echo.

cd C:\Users\HP\CascadeProjects\GESTION_STOCK_ITS_SN\backend\scripts

echo Execution du script de correction...
C:\xampp\mysql\bin\mysql -u root its_maritime_stock < fix-clients-complete.sql

echo.
echo ========================================
echo  Verification terminee!
echo  Verifiez la sortie ci-dessus
echo ========================================
pause