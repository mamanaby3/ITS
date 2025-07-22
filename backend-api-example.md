# Structure API Backend pour ITS Maritime Stock

## Configuration de la base de données

### Tables principales requises :

```sql
-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'operator') NOT NULL,
    magasin_id INT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des magasins
CREATE TABLE magasins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    responsable VARCHAR(100),
    capacite INT,
    status ENUM('actif', 'inactif') DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE produits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(200) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    categorie VARCHAR(50),
    unite VARCHAR(20),
    prix_unitaire DECIMAL(10, 2),
    seuil_alerte INT DEFAULT 0,
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table du stock
CREATE TABLE stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    produit_id INT NOT NULL,
    magasin_id INT NOT NULL,
    quantite INT DEFAULT 0,
    emplacement VARCHAR(100),
    lot VARCHAR(100),
    date_expiration DATE,
    dernier_mouvement TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    UNIQUE KEY unique_produit_magasin (produit_id, magasin_id)
);

-- Table des mouvements de stock
CREATE TABLE mouvements_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('entree', 'sortie', 'transfert') NOT NULL,
    date DATETIME NOT NULL,
    produit_id INT NOT NULL,
    magasin_id INT NOT NULL,
    quantite INT NOT NULL,
    lot VARCHAR(100),
    date_expiration DATE,
    prix_unitaire DECIMAL(10, 2),
    motif VARCHAR(255),
    reference VARCHAR(100),
    fournisseur VARCHAR(200),
    client VARCHAR(200),
    utilisateur_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (utilisateur_id) REFERENCES users(id)
);

-- Table des réceptions navire
CREATE TABLE receptions_navire (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_reception DATE NOT NULL,
    navire VARCHAR(200) NOT NULL,
    numero_conteneur VARCHAR(100),
    fournisseur VARCHAR(200),
    status ENUM('en_cours', 'completed', 'annule') DEFAULT 'completed',
    utilisateur_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES users(id)
);

-- Table des détails de réception navire
CREATE TABLE reception_navire_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reception_id INT NOT NULL,
    produit_id INT NOT NULL,
    quantite_totale INT NOT NULL,
    lot VARCHAR(100),
    date_expiration DATE,
    prix_unitaire DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reception_id) REFERENCES receptions_navire(id),
    FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Table de distribution vers les magasins
CREATE TABLE reception_distributions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reception_detail_id INT NOT NULL,
    magasin_id INT NOT NULL,
    quantite INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reception_detail_id) REFERENCES reception_navire_details(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);
```

## Endpoints API à implémenter

### Authentification

```php
// POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password123"
}

// Response
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "email": "user@example.com",
            "nom": "Diallo",
            "prenom": "Amadou",
            "role": "manager",
            "magasin_id": null
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### Stock

```php
// GET /api/stock
// Headers: Authorization: Bearer {token}
// Query params: ?magasin_id=1&produit_id=2

// POST /api/stock/entree
{
    "produit_id": 1,
    "magasin_id": 1,
    "quantite": 100,
    "lot": "LOT-2024-001",
    "date_expiration": "2025-12-31",
    "prix_unitaire": 5000,
    "fournisseur": "Fournisseur XYZ",
    "motif": "Achat"
}

// POST /api/stock/sortie
{
    "produit_id": 1,
    "magasin_id": 1,
    "quantite": 50,
    "client": "Client ABC",
    "motif": "Vente"
}

// POST /api/stock/reception-navire
{
    "dateReception": "2024-12-27",
    "navire": "MV ATLANTIC STAR",
    "numeroConteneur": "MSKU1234567",
    "fournisseur": "Import Corp",
    "produits": [
        {
            "produit_id": 1,
            "quantiteTotal": 1000,
            "lot": "LOT-2024-001",
            "dateExpiration": "2025-12-31",
            "prixUnitaire": 5000,
            "dispatch": [
                {
                    "magasin_id": 1,
                    "quantite": 400
                },
                {
                    "magasin_id": 2,
                    "quantite": 300
                },
                {
                    "magasin_id": 3,
                    "quantite": 300
                }
            ]
        }
    ]
}

// GET /api/stock/stats
// Response
{
    "success": true,
    "data": {
        "totalArticles": 45,
        "totalQuantite": 15000,
        "valeurTotale": 75000000,
        "produitsEnRupture": 3,
        "entreesToday": 5,
        "sortiesToday": 8
    }
}

// GET /api/stock/mouvements
// Query params: ?date_debut=2024-12-01&date_fin=2024-12-31&type=entree
```

### Produits

```php
// GET /api/produits
// GET /api/produits/{id}
// POST /api/produits
// PUT /api/produits/{id}
// DELETE /api/produits/{id}
```

### Magasins

```php
// GET /api/magasins
// GET /api/magasins/{id}
// GET /api/magasins/{id}/stats
// POST /api/magasins
// PUT /api/magasins/{id}
// DELETE /api/magasins/{id}
```

## Exemple d'implémentation PHP (Laravel)

### Route API (routes/api.php)

```php
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Stock
    Route::get('/stock', [StockController::class, 'index']);
    Route::get('/stock/stats', [StockController::class, 'stats']);
    Route::get('/stock/mouvements', [StockController::class, 'mouvements']);
    Route::post('/stock/entree', [StockController::class, 'entree']);
    Route::post('/stock/sortie', [StockController::class, 'sortie']);
    Route::post('/stock/reception-navire', [StockController::class, 'receptionNavire']);
    
    // Produits
    Route::apiResource('produits', ProduitController::class);
    
    // Magasins
    Route::apiResource('magasins', MagasinController::class);
    Route::get('/magasins/{id}/stats', [MagasinController::class, 'stats']);
});
```

### Controller exemple (StockController.php)

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\MouvementStock;
use App\Models\ReceptionNavire;
use Illuminate\Http\Request;
use DB;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $query = Stock::with(['produit', 'magasin']);
        
        if ($request->has('magasin_id')) {
            $query->where('magasin_id', $request->magasin_id);
        }
        
        if ($request->has('produit_id')) {
            $query->where('produit_id', $request->produit_id);
        }
        
        $stock = $query->get();
        
        return response()->json([
            'success' => true,
            'data' => $stock
        ]);
    }
    
    public function receptionNavire(Request $request)
    {
        $validated = $request->validate([
            'dateReception' => 'required|date',
            'navire' => 'required|string',
            'numeroConteneur' => 'nullable|string',
            'fournisseur' => 'nullable|string',
            'produits' => 'required|array',
            'produits.*.produit_id' => 'required|exists:produits,id',
            'produits.*.quantiteTotal' => 'required|integer|min:1',
            'produits.*.dispatch' => 'required|array',
            'produits.*.dispatch.*.magasin_id' => 'required|exists:magasins,id',
            'produits.*.dispatch.*.quantite' => 'required|integer|min:0'
        ]);
        
        DB::beginTransaction();
        
        try {
            // Créer la réception
            $reception = ReceptionNavire::create([
                'date_reception' => $validated['dateReception'],
                'navire' => $validated['navire'],
                'numero_conteneur' => $validated['numeroConteneur'],
                'fournisseur' => $validated['fournisseur'],
                'utilisateur_id' => auth()->id(),
                'status' => 'completed'
            ]);
            
            // Traiter chaque produit
            foreach ($validated['produits'] as $produitData) {
                // Créer le détail de réception
                $detail = $reception->details()->create([
                    'produit_id' => $produitData['produit_id'],
                    'quantite_totale' => $produitData['quantiteTotal'],
                    'lot' => $produitData['lot'] ?? null,
                    'date_expiration' => $produitData['dateExpiration'] ?? null,
                    'prix_unitaire' => $produitData['prixUnitaire'] ?? null
                ]);
                
                // Distribuer vers les magasins
                foreach ($produitData['dispatch'] as $dispatch) {
                    if ($dispatch['quantite'] > 0) {
                        // Créer la distribution
                        $detail->distributions()->create([
                            'magasin_id' => $dispatch['magasin_id'],
                            'quantite' => $dispatch['quantite']
                        ]);
                        
                        // Mettre à jour le stock
                        $stock = Stock::firstOrCreate(
                            [
                                'produit_id' => $produitData['produit_id'],
                                'magasin_id' => $dispatch['magasin_id']
                            ],
                            [
                                'quantite' => 0,
                                'emplacement' => 'Zone principale'
                            ]
                        );
                        
                        $stock->increment('quantite', $dispatch['quantite']);
                        $stock->update([
                            'lot' => $produitData['lot'] ?? $stock->lot,
                            'date_expiration' => $produitData['dateExpiration'] ?? $stock->date_expiration,
                            'dernier_mouvement' => now()
                        ]);
                        
                        // Créer le mouvement
                        MouvementStock::create([
                            'type' => 'entree',
                            'date' => now(),
                            'produit_id' => $produitData['produit_id'],
                            'magasin_id' => $dispatch['magasin_id'],
                            'quantite' => $dispatch['quantite'],
                            'lot' => $produitData['lot'] ?? null,
                            'date_expiration' => $produitData['dateExpiration'] ?? null,
                            'prix_unitaire' => $produitData['prixUnitaire'] ?? null,
                            'motif' => "Réception navire {$validated['navire']}",
                            'reference' => "REC-{$reception->id}",
                            'fournisseur' => $validated['fournisseur'],
                            'utilisateur_id' => auth()->id()
                        ]);
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Réception navire enregistrée avec succès',
                'data' => $reception->load('details.distributions')
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réception: ' . $e->getMessage()
            ], 500);
        }
    }
}
```

## Configuration CORS (config/cors.php)

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000',
        // Ajouter votre domaine de production
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## Pour tester l'API

1. Installer un outil comme Postman ou Insomnia
2. Créer une collection avec tous les endpoints
3. Tester d'abord l'authentification pour obtenir un token
4. Utiliser le token dans les headers pour les autres requêtes

## Sécurité

- Utiliser HTTPS en production
- Implémenter la validation des données
- Utiliser des transactions pour les opérations critiques
- Mettre en place un système de logs
- Implémenter un rate limiting
- Valider les permissions pour chaque action