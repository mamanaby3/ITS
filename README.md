# Système de Gestion de Stock - Manutention Céréalière

Application web pour la gestion de stock et le suivi des rotations de camions dans le cadre de la manutention de produits céréaliers au port de Dakar.

## Contexte

Cette application a été développée pour une entreprise spécialisée dans la manutention de produits céréaliers (maïs, soja, blé, son de blé) au port de Dakar. L'entreprise gère le stockage temporaire des produits pour le compte de clients (GMD, Avisen, Sedima, NMA) dans 7 magasins, en assurant la traçabilité complète des mouvements.

## Fonctionnalités principales

### Module Manager (Dispatch)
- Création et gestion des dispatches pour transférer les produits entre magasins
- Attribution des rotations aux chauffeurs (capacité ~40 tonnes par camion)
- Suivi en temps réel de l'avancement des opérations
- Contrôle automatique des stocks disponibles

### Module Opérateur (Réception)
- Réception des rotations de camions avec enregistrement précis des quantités
- Détection automatique des écarts (manquements, pertes en route)
- Entrée directe de stock depuis les navires
- Traçabilité complète de chaque mouvement

### Module Rapports
- Tableau de bord avec indicateurs clés en temps réel
- Rapport détaillé des écarts par chauffeur
- Historique des mouvements de stock
- Export des données en Excel
- Suivi par client, produit, magasin et période

### Module Administration
- Gestion des utilisateurs et rôles (admin, manager, opérateur)
- Configuration des clients, produits et magasins
- Gestion des chauffeurs et de leurs camions
- Paramétrage des capacités de stockage

## Technologies utilisées

- **Backend**: Python Flask
- **Base de données**: SQLite (SQLAlchemy ORM)
- **Frontend**: HTML, CSS, JavaScript
- **Authentification**: Flask-Login
- **Export**: Pandas, OpenPyxl

## Installation

### Prérequis
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

### Étapes d'installation

1. Cloner ou télécharger le projet

2. Créer un environnement virtuel
```bash
python -m venv venv
```

3. Activer l'environnement virtuel
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Installer les dépendances
```bash
pip install -r requirements.txt
```

5. Initialiser la base de données avec les données de test
```bash
python init_db.py
```

6. Lancer l'application
```bash
python run.py
```

L'application sera accessible à l'adresse: http://localhost:5000

## Utilisateurs par défaut

Après l'initialisation, les utilisateurs suivants sont créés:

- **Admin**: username=`admin`, password=`admin123`
- **Manager**: username=`manager`, password=`manager123`
- **Opérateur**: username=`operator`, password=`operator123`

## Flux de travail type

1. **Manager** crée un dispatch pour transférer X tonnes de produit du magasin A vers le magasin B
2. **Manager** planifie les rotations en assignant des chauffeurs (ex: 1000t = 25 rotations de 40t)
3. **Chauffeur** effectue le transport (statut: en transit)
4. **Opérateur** réceptionne chaque rotation et enregistre la quantité réellement livrée
5. Le système calcule automatiquement les écarts et met à jour les stocks
6. Les **Rapports** permettent d'identifier les anomalies et suivre la performance

## Structure du projet

```
GESTION_STOCK_ITS_SN/
├── app/
│   ├── __init__.py          # Initialisation Flask
│   ├── models/              # Modèles de données (Client, Product, Stock, etc.)
│   ├── views/               # Contrôleurs (auth, manager, operator, reports, admin)
│   ├── templates/           # Templates HTML organisés par module
│   ├── static/              # Fichiers CSS et JavaScript
│   └── utils/               # Utilitaires (décorateurs, helpers)
├── config/                  # Configuration de l'application
├── requirements.txt         # Dépendances Python
├── run.py                  # Point d'entrée de l'application
├── init_db.py              # Script d'initialisation de la base
└── README.md               # Ce fichier
```

## Points clés du système

### Traçabilité complète
- Chaque mouvement est enregistré avec l'opérateur, la date/heure et les quantités
- Historique complet des rotations et dispatches
- Suivi des écarts par chauffeur pour identifier les problèmes récurrents

### Contrôles automatiques
- Impossible de dispatcher plus que le stock disponible
- Détection automatique des écarts entre quantité prévue et livrée
- Alertes en cas de manquements importants

### Multi-magasins
- Gestion de 7 magasins avec capacités distinctes
- Transferts inter-magasins traçables
- Vue consolidée des stocks par client/produit

### Sécurité
- Authentification obligatoire
- Séparation des rôles (manager, opérateur, admin)
- Chaque utilisateur n'accède qu'aux fonctionnalités de son rôle

## Support

Pour toute question ou problème technique, veuillez contacter l'équipe de développement.