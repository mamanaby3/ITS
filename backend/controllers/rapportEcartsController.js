const { pool } = require('../config/database-mysql');

// Obtenir le rapport des écarts entre quantités dispatchées et entrées réelles
exports.getRapportEcarts = async (req, res) => {
    try {
        const { 
            date_debut, 
            date_fin, 
            magasin_id, 
            produit_id,
            type_ecart // 'tous', 'positif', 'negatif', 'nul'
        } = req.query;

        // Requête pour comparer dispatches vs entrées et calculer rapport entrée/sortie
        let baseQuery = `
            SELECT 
                date_mouvement,
                magasin_id,
                magasin_nom,
                produit_id,
                produit_nom,
                produit_reference,
                SUM(quantite_dispatchee) as quantite_dispatchee,
                SUM(quantite_entree) as quantite_entree,
                SUM(quantite_sortie) as quantite_sortie,
                (SUM(quantite_dispatchee) - SUM(quantite_entree)) as ecart_dispatch_entree,
                CASE 
                    WHEN SUM(quantite_sortie) = 0 THEN NULL
                    ELSE SUM(quantite_entree) / SUM(quantite_sortie)
                END as rapport_entree_sortie,
                CASE 
                    WHEN SUM(quantite_dispatchee) = 0 THEN 0
                    ELSE ((SUM(quantite_dispatchee) - SUM(quantite_entree)) / SUM(quantite_dispatchee) * 100)
                END as ecart_pourcentage,
                CASE
                    WHEN SUM(quantite_dispatchee) = SUM(quantite_entree) THEN 'conforme'
                    WHEN SUM(quantite_dispatchee) > SUM(quantite_entree) THEN 'manquant'
                    WHEN SUM(quantite_dispatchee) < SUM(quantite_entree) THEN 'excedent'
                END as statut
            FROM (
                -- Dispatches
                SELECT 
                    DATE(nd.date_dispatching) as date_mouvement,
                    nd.magasin_id,
                    m.nom as magasin_nom,
                    nc.produit_id,
                    p.nom as produit_nom,
                    p.reference as produit_reference,
                    SUM(nd.quantite) as quantite_dispatchee,
                    0 as quantite_entree,
                    0 as quantite_sortie
                FROM navire_dispatching nd
                JOIN navire_cargaison nc ON nd.cargaison_id = nc.id
                JOIN magasins m ON nd.magasin_id = m.id
                JOIN produits p ON nc.produit_id = p.id
                WHERE nd.statut IN ('complete', 'livre', 'en_cours')
                  AND nd.magasin_id IS NOT NULL
                GROUP BY DATE(nd.date_dispatching), nd.magasin_id, m.nom, nc.produit_id, p.nom, p.reference
                
                UNION ALL
                
                -- Entrées
                SELECT 
                    DATE(ms.date_mouvement) as date_mouvement,
                    ms.magasin_destination_id as magasin_id,
                    m.nom as magasin_nom,
                    ms.produit_id,
                    p.nom as produit_nom,
                    p.reference as produit_reference,
                    0 as quantite_dispatchee,
                    SUM(ms.quantite) as quantite_entree,
                    0 as quantite_sortie
                FROM mouvements_stock ms
                JOIN magasins m ON ms.magasin_destination_id = m.id
                JOIN produits p ON ms.produit_id = p.id
                WHERE ms.type_mouvement = 'entree'
                GROUP BY DATE(ms.date_mouvement), ms.magasin_destination_id, m.nom, ms.produit_id, p.nom, p.reference
                
                UNION ALL
                
                -- Sorties
                SELECT 
                    DATE(ms.date_mouvement) as date_mouvement,
                    ms.magasin_source_id as magasin_id,
                    m.nom as magasin_nom,
                    ms.produit_id,
                    p.nom as produit_nom,
                    p.reference as produit_reference,
                    0 as quantite_dispatchee,
                    0 as quantite_entree,
                    SUM(ms.quantite) as quantite_sortie
                FROM mouvements_stock ms
                JOIN magasins m ON ms.magasin_source_id = m.id
                JOIN produits p ON ms.produit_id = p.id
                WHERE ms.type_mouvement = 'sortie'
                GROUP BY DATE(ms.date_mouvement), ms.magasin_source_id, m.nom, ms.produit_id, p.nom, p.reference
            ) as combined_data
            WHERE 1=1
            GROUP BY date_mouvement, magasin_id, magasin_nom, produit_id, produit_nom, produit_reference
            HAVING (quantite_dispatchee > 0 OR quantite_entree > 0 OR quantite_sortie > 0)
        `;

        let query = `SELECT * FROM (${baseQuery}) as ecarts_data WHERE 1=1`;
        const params = [];

        // Filtres
        if (date_debut) {
            query += ' AND date_mouvement >= ?';
            params.push(date_debut);
        }

        if (date_fin) {
            query += ' AND date_mouvement <= ?';
            params.push(date_fin);
        }

        if (magasin_id && magasin_id !== 'tous') {
            query += ' AND magasin_id = ?';
            params.push(magasin_id);
        }

        if (produit_id && produit_id !== 'tous') {
            query += ' AND produit_id = ?';
            params.push(produit_id);
        }

        // Filtre par type d'écart
        if (type_ecart === 'positif') {
            query += ' AND ecart_dispatch_entree > 0';
        } else if (type_ecart === 'negatif') {
            query += ' AND ecart_dispatch_entree < 0';
        } else if (type_ecart === 'nul') {
            query += ' AND ecart_dispatch_entree = 0';
        }

        query += ' ORDER BY date_mouvement DESC, magasin_nom, produit_nom';

        const [ecarts] = await pool.query(query, params);

        // Calculer les statistiques
        const stats = {
            total_lignes: ecarts.length,
            total_dispatche: ecarts.reduce((sum, e) => sum + parseFloat(e.quantite_dispatchee || 0), 0),
            total_entree: ecarts.reduce((sum, e) => sum + parseFloat(e.quantite_entree || 0), 0),
            total_sortie: ecarts.reduce((sum, e) => sum + parseFloat(e.quantite_sortie || 0), 0),
            total_ecart: ecarts.reduce((sum, e) => sum + Math.abs(parseFloat(e.ecart_dispatch_entree || 0)), 0),
            conformes: ecarts.filter(e => e.statut === 'conforme').length,
            manquants: ecarts.filter(e => e.statut === 'manquant').length,
            excedents: ecarts.filter(e => e.statut === 'excedent').length,
            rapport_global_entree_sortie: 0
        };

        // Calculer le rapport global entrée/sortie
        if (stats.total_sortie > 0) {
            stats.rapport_global_entree_sortie = (stats.total_entree / stats.total_sortie).toFixed(2);
        }

        stats.taux_conformite = stats.total_lignes > 0 
            ? (stats.conformes / stats.total_lignes * 100).toFixed(2) 
            : 0;

        res.json({
            success: true,
            ecarts,
            stats
        });

    } catch (error) {
        console.error('Erreur getRapportEcarts:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du rapport des écarts',
            details: error.message
        });
    }
};

