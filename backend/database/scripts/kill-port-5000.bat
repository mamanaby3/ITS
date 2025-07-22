@echo off
echo Recherche du processus utilisant le port 5000...
netstat -ano | findstr :5000

echo.
echo Pour arreter le processus, notez le PID (derniere colonne) et executez:
echo taskkill /PID [numero_pid] /F
echo.
echo Ou utilisez cette commande pour tuer automatiquement tous les processus sur le port 5000:
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a

echo.
echo Processus termine!
pause