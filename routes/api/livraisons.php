<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LivraisonController;

/*
|--------------------------------------------------------------------------
| Routes API pour les Livraisons
|--------------------------------------------------------------------------
|
| Routes pour la gestion des livraisons planifiées par les managers
| et leur suivi par les magasiniers
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Routes de base CRUD
    Route::apiResource('livraisons', LivraisonController::class);
    
    // Actions spécifiques
    Route::prefix('livraisons/{livraison}')->group(function () {
        // Marquer une livraison comme en cours
        Route::post('en-cours', [LivraisonController::class, 'marquerEnCours'])
            ->name('livraisons.en-cours');
        
        // Enregistrer la réception d'une livraison
        Route::post('reception', [LivraisonController::class, 'enregistrerReception'])
            ->name('livraisons.reception');
        
        // Annuler une livraison
        Route::post('annuler', [LivraisonController::class, 'annuler'])
            ->name('livraisons.annuler');
    });
    
    // Routes pour les statistiques et comparaisons
    Route::prefix('livraisons-stats')->group(function () {
        // Statistiques générales
        Route::get('statistiques', [LivraisonController::class, 'statistiques'])
            ->name('livraisons.statistiques');
        
        // Comparaison avec les mouvements
        Route::get('comparaison', [LivraisonController::class, 'comparaison'])
            ->name('livraisons.comparaison');
    });
});

// Documentation des endpoints
/*
 * GET    /api/livraisons              - Liste des livraisons avec filtres
 * POST   /api/livraisons              - Créer une nouvelle livraison
 * GET    /api/livraisons/{id}         - Détails d'une livraison
 * PUT    /api/livraisons/{id}         - Modifier une livraison
 * DELETE /api/livraisons/{id}         - Supprimer une livraison
 * 
 * POST   /api/livraisons/{id}/en-cours    - Marquer comme en cours
 * POST   /api/livraisons/{id}/reception   - Enregistrer la réception
 * POST   /api/livraisons/{id}/annuler     - Annuler une livraison
 * 
 * GET    /api/livraisons-stats/statistiques - Statistiques globales
 * GET    /api/livraisons-stats/comparaison  - Comparaison livraisons/mouvements
 */