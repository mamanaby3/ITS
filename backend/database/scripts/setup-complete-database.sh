#!/bin/bash
# Script pour configurer complètement la base de données

echo "=== Configuration complète de la base de données ITS Maritime Stock ==="
echo ""

# Vérifier si MySQL est accessible
mysql -u root -e "SELECT 1" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur: MySQL n'est pas accessible. Assurez-vous que XAMPP/MySQL est démarré."
    exit 1
fi

echo "✅ MySQL est accessible"
echo ""

# Exécuter les scripts dans l'ordre
echo "1. Création des tables manquantes..."
mysql -u root its_maritime_stock < create-missing-tables.sql
if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

echo ""
echo "2. Création des procédures, triggers et vues..."
mysql -u root its_maritime_stock < create-procedures-triggers.sql
if [ $? -eq 0 ]; then
    echo "✅ Procédures, triggers et vues créés avec succès"
else
    echo "❌ Erreur lors de la création des procédures"
    exit 1
fi

echo ""
echo "3. Vérification finale..."
mysql -u root its_maritime_stock -e "SHOW TABLES;" | wc -l | xargs -I {} echo "Nombre total de tables: {}"
mysql -u root its_maritime_stock -e "SHOW PROCEDURE STATUS WHERE Db = 'its_maritime_stock';" | wc -l | xargs -I {} echo "Nombre de procédures: {}"

echo ""
echo "✅ Configuration de la base de données terminée avec succès!"
echo ""
echo "Vous pouvez maintenant démarrer l'application avec:"
echo "  cd .. && npm start"