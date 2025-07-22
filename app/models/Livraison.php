<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Livraison extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'livraisons';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'numero_bon_livraison',
        'date_livraison',
        'heure_depart',
        'produit_id',
        'quantite',
        'type_livraison',
        'magasin_id',
        'client_id',
        'particulier_nom',
        'particulier_telephone',
        'particulier_adresse',
        'transporteur',
        'numero_camion',
        'nom_chauffeur',
        'permis_chauffeur',
        'telephone_chauffeur',
        'destination_finale',
        'observations',
        'statut',
        'date_reception',
        'heure_reception',
        'quantite_recue',
        'motif_ecart',
        'mouvement_entree_id',
        'created_by',
        'updated_by'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_livraison' => 'date',
        'date_reception' => 'date',
        'heure_depart' => 'datetime:H:i',
        'heure_reception' => 'datetime:H:i',
        'quantite' => 'decimal:2',
        'quantite_recue' => 'decimal:2',
        'ecart' => 'decimal:2'
    ];

    /**
     * The attributes that should be appended.
     *
     * @var array<int, string>
     */
    protected $appends = ['statut_comparaison', 'destination_nom'];

    /**
     * Les statuts possibles pour une livraison
     */
    const STATUT_PLANIFIE = 'planifie';
    const STATUT_EN_COURS = 'en_cours';
    const STATUT_LIVRE = 'livre';
    const STATUT_ANNULE = 'annule';
    const STATUT_RETARD = 'retard';

    /**
     * Les types de livraison possibles
     */
    const TYPE_MAGASIN = 'magasin';
    const TYPE_CLIENT = 'client';
    const TYPE_PARTICULIER = 'particulier';

    /**
     * Get the produit for the livraison.
     */
    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class);
    }

    /**
     * Get the magasin for the livraison.
     */
    public function magasin(): BelongsTo
    {
        return $this->belongsTo(Magasin::class);
    }

    /**
     * Get the client for the livraison.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the mouvement d'entrée associé.
     */
    public function mouvementEntree(): BelongsTo
    {
        return $this->belongsTo(Mouvement::class, 'mouvement_entree_id');
    }

    /**
     * Get the user who created the livraison.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the livraison.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the statut de comparaison attribute.
     *
     * @return string
     */
    public function getStatutComparaisonAttribute(): string
    {
        if ($this->quantite_recue === null) {
            return 'Non reçu';
        }

        $ecart = abs($this->ecart ?? 0);
        
        if ($ecart < 0.01) {
            return 'Conforme';
        } elseif ($this->ecart > 0) {
            return 'Manquant';
        } else {
            return 'Excédent';
        }
    }

    /**
     * Get the destination nom attribute.
     *
     * @return string|null
     */
    public function getDestinationNomAttribute(): ?string
    {
        switch ($this->type_livraison) {
            case self::TYPE_MAGASIN:
                return $this->magasin?->nom;
            case self::TYPE_CLIENT:
                return $this->client?->nom;
            case self::TYPE_PARTICULIER:
                return $this->particulier_nom;
            default:
                return null;
        }
    }

    /**
     * Scope pour les livraisons planifiées
     */
    public function scopePlanifiees($query)
    {
        return $query->where('statut', self::STATUT_PLANIFIE);
    }

    /**
     * Scope pour les livraisons en cours
     */
    public function scopeEnCours($query)
    {
        return $query->where('statut', self::STATUT_EN_COURS);
    }

    /**
     * Scope pour les livraisons livrées
     */
    public function scopeLivrees($query)
    {
        return $query->where('statut', self::STATUT_LIVRE);
    }

    /**
     * Scope pour les livraisons avec écart
     */
    public function scopeAvecEcart($query)
    {
        return $query->whereNotNull('quantite_recue')
                     ->whereRaw('ABS(quantite - quantite_recue) > 0.01');
    }

    /**
     * Scope pour filtrer par période
     */
    public function scopePeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_livraison', [$dateDebut, $dateFin]);
    }

    /**
     * Scope pour filtrer par magasin
     */
    public function scopeParMagasin($query, $magasinId)
    {
        return $query->where('magasin_id', $magasinId);
    }

    /**
     * Marquer comme en cours
     */
    public function marquerEnCours(): bool
    {
        $this->statut = self::STATUT_EN_COURS;
        return $this->save();
    }

    /**
     * Marquer comme livré avec la quantité reçue
     */
    public function marquerLivre(float $quantiteRecue, ?string $motifEcart = null): bool
    {
        $this->statut = self::STATUT_LIVRE;
        $this->quantite_recue = $quantiteRecue;
        $this->date_reception = now();
        $this->heure_reception = now();
        
        if ($motifEcart) {
            $this->motif_ecart = $motifEcart;
        }
        
        return $this->save();
    }

    /**
     * Annuler la livraison
     */
    public function annuler(string $motif): bool
    {
        $this->statut = self::STATUT_ANNULE;
        $this->observations = $this->observations . "\nAnnulée: " . $motif;
        return $this->save();
    }

    /**
     * Vérifier si la livraison a un écart significatif
     */
    public function hasEcartSignificatif(float $seuil = 0.01): bool
    {
        return $this->quantite_recue !== null && abs($this->ecart) > $seuil;
    }

    /**
     * Calculer le pourcentage d'écart
     */
    public function pourcentageEcart(): ?float
    {
        if ($this->quantite_recue === null || $this->quantite == 0) {
            return null;
        }

        return (($this->quantite - $this->quantite_recue) / $this->quantite) * 100;
    }
}