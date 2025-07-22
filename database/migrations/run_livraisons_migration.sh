#!/bin/bash

# Script pour exécuter la migration de la table livraisons
# Base de données: its_maritime_stock

echo "==================================="
echo "Migration: Table Livraisons"
echo "Base de données: its_maritime_stock"
echo "==================================="

# Demander les informations de connexion
read -p "Utilisateur MySQL (par défaut: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Mot de passe MySQL: " DB_PASS
echo

read -p "Hôte MySQL (par défaut: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port MySQL (par défaut: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

# Nom de la base de données
DB_NAME="its_maritime_stock"

echo
echo "Connexion à MySQL..."

# Exécuter la migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < create_livraisons_table.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration exécutée avec succès!"
    echo
    echo "Table créée: livraisons"
    echo "Vue créée: v_livraisons_comparaison"
    echo "Triggers créés: before_insert_livraison, after_update_livraison_reception"
else
    echo "❌ Erreur lors de l'exécution de la migration"
    exit 1
fi

echo
echo "==================================="
echo "Migration terminée"
echo "====================================="