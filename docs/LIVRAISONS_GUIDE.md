# Guide du Système de Gestion des Livraisons

## Vue d'ensemble

Le système de gestion des livraisons permet de suivre le flux complet depuis l'enregistrement d'une livraison par le manager jusqu'à la réception par le magasinier.

## Base de données : `its_maritime_stock`

### Table `livraisons`

Cette table stocke toutes les livraisons planifiées et leur suivi.

## Flux de travail

### 1. Manager - Enregistrement de la livraison

Le manager enregistre une livraison prévue avec :
- **Produit** et **quantité** à livrer
- **Type de destination** : magasin, client ou particulier
- **Informations de transport** : transporteur, camion, chauffeur
- **Date et heure** de départ prévue

**Statut initial** : `planifie`

### 2. Transport - En cours de livraison

Quand le camion part, la livraison passe au statut `en_cours`.

### 3. Magasinier - Réception

Le magasinier :
- Effectue la **saisie des entrées** quand le camion arrive
- Enregistre la **quantité réellement reçue**
- Note tout **écart** éventuel avec motif

**Statut final** : `livre`

### 4. Comparaison et analyse

Le système compare automatiquement :
- **Quantité prévue** vs **Quantité reçue**
- Calcule les **écarts**
- Génère des **statistiques** de conformité

## Statuts des livraisons

- `planifie` : Livraison enregistrée, pas encore partie
- `en_cours` : Camion en route
- `livre` : Livraison reçue et vérifiée
- `annule` : Livraison annulée
- `retard` : Livraison en retard

## Types de comparaison

- **Conforme** : Écart < 0.01 tonne
- **Manquant** : Quantité reçue < Quantité prévue
- **Excédent** : Quantité reçue > Quantité prévue
- **Non reçu** : Livraison prévue mais pas de réception
- **Non prévu** : Réception sans livraison prévue

## Installation

### 1. Exécuter la migration SQL

```bash
cd database/migrations
./run_livraisons_migration.sh
```

Ou manuellement :
```bash
mysql -u root -p its_maritime_stock < create_livraisons_table.sql
```

### 2. Avec Laravel (optionnel)

```bash
php artisan migrate
```

## API Endpoints

### Livraisons

- `GET /api/livraisons` - Liste des livraisons avec filtres
- `POST /api/livraisons` - Créer une livraison
- `GET /api/livraisons/{id}` - Détails d'une livraison
- `PUT /api/livraisons/{id}` - Modifier une livraison
- `POST /api/livraisons/{id}/en-cours` - Marquer en cours
- `POST /api/livraisons/{id}/reception` - Enregistrer réception
- `POST /api/livraisons/{id}/annuler` - Annuler

### Statistiques

- `GET /api/livraisons-stats/statistiques` - Statistiques globales
- `GET /api/livraisons-stats/comparaison` - Comparaison avec mouvements

## Exemples d'utilisation

### Créer une livraison (Manager)

```json
POST /api/livraisons
{
  "date_livraison": "2024-01-15",
  "heure_depart": "08:00",
  "produit_id": 1,
  "quantite": 25.5,
  "type_livraison": "magasin",
  "magasin_id": 2,
  "transporteur": "Transport Express",
  "numero_camion": "DK-1234-AB",
  "nom_chauffeur": "Mamadou Diop",
  "permis_chauffeur": "SN123456"
}
```

### Enregistrer une réception (Magasinier)

```json
POST /api/livraisons/{id}/reception
{
  "quantite_recue": 25.3,
  "motif_ecart": "Légère différence de pesage",
  "mouvement_entree_id": 123
}
```

### Filtrer les livraisons

```
GET /api/livraisons?date_debut=2024-01-01&date_fin=2024-01-31&statut=livre&magasin_id=2
```

## Rapports et analyses

Le système génère automatiquement :
- **Taux de conformité** : % de livraisons sans écart significatif
- **Total des écarts** : Somme des différences en tonnes
- **Statistiques par statut** : Nombre de livraisons par statut
- **Comparaisons détaillées** : Vue complète des écarts

## Sécurité et permissions

- **Managers** : Création et modification des livraisons
- **Magasiniers** : Enregistrement des réceptions uniquement
- **Tous** : Consultation des statistiques et comparaisons

## Maintenance

### Vérifier les livraisons en retard

```sql
UPDATE livraisons 
SET statut = 'retard' 
WHERE statut = 'planifie' 
AND date_livraison < CURDATE();
```

### Nettoyer les anciennes données

```sql
DELETE FROM livraisons 
WHERE date_livraison < DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
AND statut IN ('livre', 'annule');
```