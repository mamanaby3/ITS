<?php

namespace App\Http\Controllers;

use App\Models\Livraison;
use App\Models\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class LivraisonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Livraison::with(['produit', 'magasin', 'client', 'createdBy']);

        // Filtres
        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->periode($request->date_debut, $request->date_fin);
        }

        if ($request->has('statut') && $request->statut !== 'tous') {
            $query->where('statut', $request->statut);
        }

        if ($request->has('magasin_id') && $request->magasin_id !== 'tous') {
            $query->parMagasin($request->magasin_id);
        }

        if ($request->has('produit_id')) {
            $query->where('produit_id', $request->produit_id);
        }

        if ($request->has('type_livraison')) {
            $query->where('type_livraison', $request->type_livraison);
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_bon_livraison', 'like', "%{$search}%")
                  ->orWhere('numero_camion', 'like', "%{$search}%")
                  ->orWhere('nom_chauffeur', 'like', "%{$search}%")
                  ->orWhere('transporteur', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->get('sort_by', 'date_livraison');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $livraisons = $query->paginate($perPage);

        return response()->json($livraisons);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date_livraison' => 'required|date',
            'heure_depart' => 'nullable|date_format:H:i',
            'produit_id' => 'required|exists:produits,id',
            'quantite' => 'required|numeric|min:0.01',
            'type_livraison' => ['required', Rule::in(['magasin', 'client', 'particulier'])],
            'magasin_id' => 'required_if:type_livraison,magasin|exists:magasins,id',
            'client_id' => 'required_if:type_livraison,client|exists:clients,id',
            'particulier_nom' => 'required_if:type_livraison,particulier|string|max:100',
            'particulier_telephone' => 'required_if:type_livraison,particulier|string|max:20',
            'particulier_adresse' => 'required_if:type_livraison,particulier|string',
            'transporteur' => 'required|string|max:100',
            'numero_camion' => 'required|string|max:50',
            'nom_chauffeur' => 'required|string|max:100',
            'permis_chauffeur' => 'required|string|max:50',
            'telephone_chauffeur' => 'nullable|string|max:20',
            'destination_finale' => 'nullable|string|max:255',
            'observations' => 'nullable|string',
            'numero_bon_livraison' => 'nullable|string|max:50|unique:livraisons'
        ]);

        DB::beginTransaction();
        try {
            $validated['created_by'] = Auth::id();
            $validated['statut'] = Livraison::STATUT_EN_COURS;

            $livraison = Livraison::create($validated);

            // Charger les relations
            $livraison->load(['produit', 'magasin', 'client', 'createdBy']);

            DB::commit();

            return response()->json([
                'message' => 'Livraison créée avec succès',
                'data' => $livraison
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création de la livraison',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Livraison $livraison)
    {
        $livraison->load(['produit', 'magasin', 'client', 'mouvementEntree', 'createdBy', 'updatedBy']);
        
        return response()->json($livraison);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Livraison $livraison)
    {
        // Empêcher la modification si la livraison est déjà livrée
        if ($livraison->statut === Livraison::STATUT_LIVRE) {
            return response()->json([
                'message' => 'Impossible de modifier une livraison déjà livrée'
            ], 403);
        }

        $validated = $request->validate([
            'date_livraison' => 'sometimes|date',
            'heure_depart' => 'nullable|date_format:H:i',
            'quantite' => 'sometimes|numeric|min:0.01',
            'transporteur' => 'sometimes|string|max:100',
            'numero_camion' => 'sometimes|string|max:50',
            'nom_chauffeur' => 'sometimes|string|max:100',
            'permis_chauffeur' => 'sometimes|string|max:50',
            'telephone_chauffeur' => 'nullable|string|max:20',
            'destination_finale' => 'nullable|string|max:255',
            'observations' => 'nullable|string',
            'statut' => ['sometimes', Rule::in(['planifie', 'en_cours', 'annule'])]
        ]);

        DB::beginTransaction();
        try {
            $validated['updated_by'] = Auth::id();
            $livraison->update($validated);

            DB::commit();

            return response()->json([
                'message' => 'Livraison mise à jour avec succès',
                'data' => $livraison->fresh(['produit', 'magasin', 'client'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la livraison',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer une livraison comme en cours
     */
    public function marquerEnCours(Livraison $livraison)
    {
        if ($livraison->statut !== Livraison::STATUT_PLANIFIE) {
            return response()->json([
                'message' => 'Cette livraison ne peut pas être marquée en cours'
            ], 403);
        }

        $livraison->marquerEnCours();

        return response()->json([
            'message' => 'Livraison marquée comme en cours',
            'data' => $livraison
        ]);
    }

    /**
     * Enregistrer la réception d'une livraison
     */
    public function enregistrerReception(Request $request, Livraison $livraison)
    {
        if ($livraison->statut === Livraison::STATUT_LIVRE) {
            return response()->json([
                'message' => 'Cette livraison a déjà été réceptionnée'
            ], 403);
        }

        $validated = $request->validate([
            'quantite_recue' => 'required|numeric|min:0',
            'motif_ecart' => 'nullable|string',
            'mouvement_entree_id' => 'nullable|exists:mouvements,id'
        ]);

        DB::beginTransaction();
        try {
            $livraison->marquerLivre($validated['quantite_recue'], $validated['motif_ecart'] ?? null);
            
            if (isset($validated['mouvement_entree_id'])) {
                $livraison->mouvement_entree_id = $validated['mouvement_entree_id'];
                $livraison->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Réception enregistrée avec succès',
                'data' => $livraison->fresh(['produit', 'magasin', 'mouvementEntree'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement de la réception',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Annuler une livraison
     */
    public function annuler(Request $request, Livraison $livraison)
    {
        if ($livraison->statut === Livraison::STATUT_LIVRE) {
            return response()->json([
                'message' => 'Impossible d\'annuler une livraison déjà livrée'
            ], 403);
        }

        $validated = $request->validate([
            'motif' => 'required|string'
        ]);

        $livraison->annuler($validated['motif']);

        return response()->json([
            'message' => 'Livraison annulée avec succès',
            'data' => $livraison
        ]);
    }

    /**
     * Obtenir les statistiques des livraisons
     */
    public function statistiques(Request $request)
    {
        $query = Livraison::query();

        // Appliquer les filtres de période
        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->periode($request->date_debut, $request->date_fin);
        }

        // Statistiques par statut
        $parStatut = (clone $query)->select('statut', DB::raw('COUNT(*) as count'))
            ->groupBy('statut')
            ->pluck('count', 'statut');

        // Statistiques des écarts
        $avecEcart = (clone $query)->livrees()->avecEcart()->count();
        $conformes = (clone $query)->livrees()
            ->whereRaw('ABS(quantite - quantite_recue) <= 0.01')
            ->count();

        // Tonnages
        $tonnagePrevu = (clone $query)->sum('quantite');
        $tonnageRecu = (clone $query)->whereNotNull('quantite_recue')->sum('quantite_recue');
        $ecartTotal = $tonnagePrevu - $tonnageRecu;

        // Taux de conformité
        $totalLivrees = (clone $query)->livrees()->count();
        $tauxConformite = $totalLivrees > 0 ? ($conformes / $totalLivrees) * 100 : 0;

        return response()->json([
            'par_statut' => $parStatut,
            'ecarts' => [
                'avec_ecart' => $avecEcart,
                'conformes' => $conformes,
                'taux_conformite' => round($tauxConformite, 2)
            ],
            'tonnages' => [
                'prevu' => round($tonnagePrevu, 2),
                'recu' => round($tonnageRecu, 2),
                'ecart' => round($ecartTotal, 2)
            ]
        ]);
    }

    /**
     * Comparaison avec les mouvements d'entrée
     */
    public function comparaison(Request $request)
    {
        $dateDebut = $request->get('date_debut', now()->subDays(7)->format('Y-m-d'));
        $dateFin = $request->get('date_fin', now()->format('Y-m-d'));

        // Récupérer les livraisons
        $livraisons = Livraison::with(['produit', 'magasin', 'client', 'mouvementEntree'])
            ->periode($dateDebut, $dateFin)
            ->get();

        // Récupérer les mouvements d'entrée sans livraison associée
        $mouvementsSansLivraison = Mouvement::with(['produit', 'magasin', 'client'])
            ->where('type', 'entree')
            ->whereBetween('date_entree', [$dateDebut, $dateFin])
            ->whereNotIn('id', $livraisons->pluck('mouvement_entree_id')->filter())
            ->get();

        $comparaisons = [];

        // Comparaisons pour les livraisons
        foreach ($livraisons as $livraison) {
            $comparaisons[] = [
                'type' => 'livraison',
                'id' => $livraison->id,
                'date' => $livraison->date_livraison,
                'produit' => $livraison->produit,
                'magasin' => $livraison->magasin,
                'quantite_prevue' => $livraison->quantite,
                'quantite_recue' => $livraison->quantite_recue,
                'ecart' => $livraison->ecart,
                'statut_comparaison' => $livraison->statut_comparaison,
                'statut_livraison' => $livraison->statut,
                'transporteur' => $livraison->transporteur,
                'camion' => $livraison->numero_camion,
                'chauffeur' => $livraison->nom_chauffeur,
                'has_mouvement' => $livraison->mouvement_entree_id !== null
            ];
        }

        // Ajouter les mouvements sans livraison
        foreach ($mouvementsSansLivraison as $mouvement) {
            $comparaisons[] = [
                'type' => 'mouvement_seul',
                'id' => $mouvement->id,
                'date' => $mouvement->date_entree,
                'produit' => $mouvement->produit,
                'magasin' => $mouvement->magasin,
                'quantite_prevue' => 0,
                'quantite_recue' => $mouvement->tonnage,
                'ecart' => -$mouvement->tonnage,
                'statut_comparaison' => 'Non prévu',
                'statut_livraison' => null,
                'transporteur' => null,
                'camion' => null,
                'chauffeur' => null,
                'has_mouvement' => true
            ];
        }

        // Trier par date décroissante
        usort($comparaisons, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return response()->json([
            'data' => $comparaisons,
            'statistiques' => [
                'total' => count($comparaisons),
                'conformes' => count(array_filter($comparaisons, fn($c) => $c['statut_comparaison'] === 'Conforme')),
                'avec_ecart' => count(array_filter($comparaisons, fn($c) => in_array($c['statut_comparaison'], ['Manquant', 'Excédent']))),
                'non_recus' => count(array_filter($comparaisons, fn($c) => $c['statut_comparaison'] === 'Non reçu')),
                'non_prevus' => count(array_filter($comparaisons, fn($c) => $c['statut_comparaison'] === 'Non prévu'))
            ]
        ]);
    }
}