# Endpoints API Requis pour les Notifications

## Configuration
- Base URL: `http://localhost:8000/api` (ou votre backend)
- Headers requis: `Authorization: Bearer {token}`

## Endpoints pour les Notifications

### 1. **GET /api/stock/alertes**
Retourne les alertes de stock bas ou rupture.

**Response:**
```json
[
  {
    "id": 1,
    "type": "stock_bas", // ou "rupture"
    "produit": {
      "id": 1,
      "nom": "Riz"
    },
    "quantite_restante": 30,
    "message": "Stock faible: Riz - 30 T restantes",
    "created_at": "2024-01-07T10:00:00Z"
  }
]
```

### 2. **GET /api/navires**
Récupère les navires avec filtres.

**Query params:**
- `statut`: "en_attente" | "dispatche" | "complete"

**Response:**
```json
[
  {
    "id": 1,
    "nom": "MSC CLARA",
    "tonnage_total": 5000,
    "statut": "en_attente",
    "date_arrivee": "2024-01-07T08:00:00Z"
  }
]
```

### 3. **GET /api/navires/dispatches/en-attente**
Retourne les dispatches non confirmés.

**Response:**
```json
[
  {
    "id": 1,
    "quantite": 100,
    "produit": {
      "id": 1,
      "nom": "Riz"
    },
    "magasin": {
      "id": "plateforme-bel-air",
      "nom": "Plateforme Bel Air"
    },
    "statut": "en_attente",
    "created_at": "2024-01-07T10:00:00Z"
  }
]
```

### 4. **GET /api/navires/dispatches/recents**
Retourne les dispatches récents pour un magasin.

**Query params:**
- `magasin_id`: ID du magasin
- `limit`: Nombre de résultats (défaut: 10)

**Response:**
```json
[
  {
    "id": 1,
    "quantite": 100,
    "produit": {
      "id": 1,
      "nom": "Riz"
    },
    "statut": "confirme",
    "date_confirmation": "2024-01-07T11:00:00Z",
    "created_at": "2024-01-07T10:00:00Z"
  }
]
```

### 5. **GET /api/navires/rotations/en-transit**
Retourne les rotations en cours vers un magasin.

**Query params:**
- `magasin_id`: ID du magasin

**Response:**
```json
[
  {
    "id": 1,
    "quantite": 150,
    "date_arrivee_prevue": "2024-01-07T14:30:00Z",
    "created_at": "2024-01-07T10:00:00Z"
  }
]
```

### 6. **GET /api/stock**
Récupère le stock avec filtres.

**Query params:**
- `magasin_id`: ID du magasin (optionnel)

**Response:**
```json
[
  {
    "id": 1,
    "produit": {
      "id": 1,
      "nom": "Riz"
    },
    "quantite_disponible": 45,
    "magasin_id": "plateforme-bel-air"
  }
]
```

### 7. **GET /api/notifications**
Récupère les notifications de l'utilisateur.

**Query params:**
- `magasin_id`: ID du magasin (optionnel)
- `user_id`: ID de l'utilisateur (optionnel)

**Response:**
```json
[
  {
    "id": 1,
    "type": "dispatch_recu",
    "titre": "Stock reçu",
    "message": "100 T de Riz disponible",
    "read": false,
    "created_at": "2024-01-07T10:00:00Z"
  }
]
```

### 8. **PUT /api/notifications/{id}/read**
Marque une notification comme lue.

**Response:**
```json
{
  "success": true
}
```

## Notes d'implémentation

1. **Authentification**: Tous les endpoints doivent vérifier le token JWT et retourner 401 si non autorisé.

2. **Filtrage par rôle**: 
   - Les managers voient toutes les données
   - Les opérateurs voient uniquement les données de leur magasin

3. **Format des dates**: Utiliser ISO 8601 (ex: "2024-01-07T10:00:00Z")

4. **Codes de statut HTTP**:
   - 200: Succès
   - 401: Non autorisé
   - 403: Interdit
   - 404: Non trouvé
   - 500: Erreur serveur

## Endpoint spécial pour le Tableau de Bord Opérationnel

### 9. **GET /api/rotations**
Récupère les rotations de camions (pour le manager).

**Query params:**
- `date`: Date au format YYYY-MM-DD (optionnel, défaut: aujourd'hui)
- `magasin_id`: ID du magasin de destination (optionnel)
- `produit_id`: ID du produit transporté (optionnel)

**Response:**
```json
[
  {
    "id": 1,
    "numero_camion": "DK-4567-AB",
    "chauffeur": "Mamadou DIOP",
    "permis_conduire": "SN1234567",
    "produit": {
      "id": 1,
      "nom": "Riz"
    },
    "quantite": 40,
    "magasin": {
      "id": "bel-air",
      "nom": "Plateforme Bel Air"
    },
    "type_destination": "Magasin", // ou "Client"
    "client_id": null, // null si destination = magasin
    "statut": "Livré", // "En cours", "Livré"
    "date_livraison": "2024-01-07T14:30:00Z",
    "created_at": "2024-01-07T14:30:00Z"
  }
]
```

**Note importante**: Cet endpoint doit retourner toutes les rotations effectuées par les camions pour transporter les dispatches du manager vers les magasins ou directement aux clients. C'est le flux principal que le manager doit surveiller.

5. **Gestion des erreurs**: Retourner un objet d'erreur structuré:
```json
{
  "error": true,
  "message": "Description de l'erreur",
  "code": "ERROR_CODE"
}
```