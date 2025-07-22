@echo off
echo ===================================
echo Migration: Table Livraisons
echo Base de donnees: its_maritime_stock
echo ===================================
echo.

set /p DB_USER="Utilisateur MySQL (par defaut: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Mot de passe MySQL: "

set /p DB_HOST="Hote MySQL (par defaut: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Port MySQL (par defaut: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set DB_NAME=its_maritime_stock

echo.
echo Connexion a MySQL...
echo.

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < create_livraisons_table.sql

if %ERRORLEVEL% == 0 (
    echo.
    echo [OK] Migration executee avec succes!
    echo.
    echo Table creee: livraisons
    echo Vue creee: v_livraisons_comparaison
    echo Triggers crees: before_insert_livraison, after_update_livraison_reception
) else (
    echo.
    echo [ERREUR] Erreur lors de l'execution de la migration
)

echo.
echo ===================================
echo Migration terminee
echo ===================================
pause