<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('livraisons', function (Blueprint $table) {
            $table->id();
            
            // Informations de base
            $table->string('numero_bon_livraison', 50)->unique();
            $table->date('date_livraison');
            $table->time('heure_depart')->nullable();
            
            // Produit et quantité
            $table->foreignId('produit_id')->constrained('produits');
            $table->decimal('quantite', 10, 2)->comment('Quantité en tonnes');
            
            // Type de livraison et destination
            $table->enum('type_livraison', ['magasin', 'client', 'particulier'])->default('magasin');
            $table->foreignId('magasin_id')->nullable()->constrained('magasins');
            $table->foreignId('client_id')->nullable()->constrained('clients');
            
            // Informations particulier
            $table->string('particulier_nom', 100)->nullable();
            $table->string('particulier_telephone', 20)->nullable();
            $table->text('particulier_adresse')->nullable();
            
            // Informations de transport
            $table->string('transporteur', 100);
            $table->string('numero_camion', 50);
            $table->string('nom_chauffeur', 100);
            $table->string('permis_chauffeur', 50);
            $table->string('telephone_chauffeur', 20)->nullable();
            
            // Destination et observations
            $table->string('destination_finale')->nullable();
            $table->text('observations')->nullable();
            
            // Statut
            $table->enum('statut', ['planifie', 'en_cours', 'livre', 'annule', 'retard'])
                  ->default('planifie');
            
            // Informations de réception
            $table->date('date_reception')->nullable();
            $table->time('heure_reception')->nullable();
            $table->decimal('quantite_recue', 10, 2)->nullable()->comment('Quantité effectivement reçue');
            $table->decimal('ecart', 10, 2)->virtualAs('quantite - IFNULL(quantite_recue, 0)');
            $table->text('motif_ecart')->nullable();
            
            // Référence au mouvement d'entrée
            $table->foreignId('mouvement_entree_id')->nullable()->constrained('mouvements');
            
            // Métadonnées
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            
            // Index
            $table->index('date_livraison');
            $table->index('statut');
            $table->index('numero_camion');
            $table->index('nom_chauffeur');
            $table->index(['type_livraison', 'magasin_id', 'client_id']);
        });

        // Trigger pour générer le numéro de bon automatiquement
        DB::unprepared('
            CREATE TRIGGER before_insert_livraison
            BEFORE INSERT ON livraisons
            FOR EACH ROW
            BEGIN
                IF NEW.numero_bon_livraison IS NULL OR NEW.numero_bon_livraison = "" THEN
                    SET NEW.numero_bon_livraison = CONCAT(
                        "BL-", 
                        YEAR(NEW.date_livraison), 
                        "-", 
                        LPAD((SELECT COUNT(*) + 1 FROM livraisons WHERE YEAR(date_livraison) = YEAR(NEW.date_livraison)), 5, "0")
                    );
                END IF;
            END
        ');

        // Vue pour faciliter les comparaisons
        DB::statement('
            CREATE OR REPLACE VIEW v_livraisons_comparaison AS
            SELECT 
                l.id,
                l.numero_bon_livraison,
                l.date_livraison,
                l.type_livraison,
                p.nom as produit_nom,
                p.reference as produit_reference,
                l.quantite as quantite_prevue,
                l.quantite_recue,
                l.ecart,
                CASE 
                    WHEN l.quantite_recue IS NULL THEN "Non reçu"
                    WHEN ABS(l.ecart) < 0.01 THEN "Conforme"
                    WHEN l.ecart > 0 THEN "Manquant"
                    ELSE "Excédent"
                END as statut_comparaison,
                l.statut as statut_livraison,
                COALESCE(mag.nom, cl.nom, l.particulier_nom) as destination_nom,
                l.transporteur,
                l.numero_camion,
                l.nom_chauffeur,
                u.name as created_by_nom
            FROM livraisons l
            JOIN produits p ON l.produit_id = p.id
            LEFT JOIN magasins mag ON l.magasin_id = mag.id
            LEFT JOIN clients cl ON l.client_id = cl.id
            LEFT JOIN users u ON l.created_by = u.id
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS before_insert_livraison');
        DB::statement('DROP VIEW IF EXISTS v_livraisons_comparaison');
        Schema::dropIfExists('livraisons');
    }
};