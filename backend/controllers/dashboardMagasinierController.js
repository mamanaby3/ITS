const db = require('../config/database-mysql');

// GET /api/dashboard/magasinier - Dashboard pour les magasiniers
exports.getDashboardMagasinier = async (req, res) => {
    try {
        const magasinId = req.user.magasin_id;
        
        if (!magasinId) {
            return res.status(400).json({
                success: false,
                message: 'Aucun magasin associé à cet utilisateur'
            });
        }

        // 1. Stock total du magasin
        const [stockTotal] = await db.execute(`
            SELECT 
                COUNT(DISTINCT produit_id) as nombre_produits,
                ROUND(SUM(quantite_disponible), 2) as tonnage_total,
                COUNT(CASE WHEN quantite_disponible <= COALESCE(p.seuil_alerte, 50) THEN 1 END) as produits_en_alerte
            FROM stocks s
            JOIN produits p ON s.produit_id = p.id
            WHERE s.magasin_id = ?
            AND s.quantite_disponible > 0
        `, [magasinId]);

        // 2. Mouvements du jour
        const [mouvementsJour] = await db.execute(`
            SELECT 
                type_mouvement,
                COUNT(*) as nombre,
                ROUND(SUM(quantite), 2) as tonnage
            FROM mouvements_stock
            WHERE DATE(date_mouvement) = CURDATE()
            AND (magasin_source_id = ? OR magasin_destination_id = ?)
            GROUP BY type_mouvement
        `, [magasinId, magasinId]);

        // 3. Dernières sorties
        const [dernieresSorties] = await db.execute(`
            SELECT 
                m.id,
                m.quantite,
                m.date_mouvement,
                p.nom as produit_nom,
                p.unite,
                c.nom as client_nom
            FROM mouvements_stock m
            JOIN produits p ON m.produit_id = p.id
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.type_mouvement = 'sortie'
            AND m.magasin_source_id = ?
            AND DATE(m.date_mouvement) = CURDATE()
            ORDER BY m.date_mouvement DESC
            LIMIT 5
        `, [magasinId]);

        // 4. Produits en alerte
        const [produitsAlerte] = await db.execute(`
            SELECT 
                s.id,
                s.produit_id,
                p.nom as produit_nom,
                p.unite,
                s.quantite_disponible,
                p.seuil_alerte
            FROM stocks s
            JOIN produits p ON s.produit_id = p.id
            WHERE s.magasin_id = ?
            AND s.quantite_disponible <= COALESCE(p.seuil_alerte, 50)
            ORDER BY s.quantite_disponible ASC
            LIMIT 10
        `, [magasinId]);

        // Calculer les stats des mouvements
        let entreesJour = 0;
        let sortiesJour = 0;
        let tonnageEntrees = 0;
        let tonnageSorties = 0;

        mouvementsJour.forEach(m => {
            if (m.type_mouvement === 'entree') {
                entreesJour = m.nombre;
                tonnageEntrees = m.tonnage;
            } else if (m.type_mouvement === 'sortie') {
                sortiesJour = m.nombre;
                tonnageSorties = m.tonnage;
            }
        });

        // Dernière sortie
        const derniereSortie = dernieresSorties.length > 0 
            ? new Date(dernieresSorties[0].date_mouvement).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })
            : null;

        res.json({
            success: true,
            data: {
                stats: {
                    totalProduits: stockTotal[0].nombre_produits || 0,
                    tonnageTotal: stockTotal[0].tonnage_total || 0,
                    produitsEnAlerte: stockTotal[0].produits_en_alerte || 0,
                    entreesJour,
                    sortiesJour,
                    tonnageEntrees,
                    tonnageSorties,
                    derniereSortie
                },
                alertes: produitsAlerte,
                dernieresSorties,
                mouvementsJour
            }
        });

    } catch (error) {
        console.error('Erreur dashboard magasinier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données',
            error: error.message
        });
    }
};

// GET /api/dashboard/magasinier/stats - Stats détaillées du magasinier
exports.getStatsMagasinier = async (req, res) => {
    try {
        const magasinId = req.user.magasin_id;
        const { periode = '7' } = req.query; // Période en jours

        // Evolution sur la période
        const [evolution] = await db.execute(`
            SELECT 
                DATE(date_mouvement) as date,
                SUM(CASE WHEN type_mouvement = 'entree' THEN quantite ELSE 0 END) as entrees,
                SUM(CASE WHEN type_mouvement = 'sortie' THEN quantite ELSE 0 END) as sorties
            FROM mouvements_stock
            WHERE (magasin_source_id = ? OR magasin_destination_id = ?)
            AND date_mouvement >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(date_mouvement)
            ORDER BY date
        `, [magasinId, magasinId, parseInt(periode)]);

        // Top produits mouvementés
        const [topProduits] = await db.execute(`
            SELECT 
                p.nom as produit_nom,
                p.unite,
                COUNT(*) as nombre_mouvements,
                SUM(m.quantite) as quantite_totale
            FROM mouvements_stock m
            JOIN produits p ON m.produit_id = p.id
            WHERE (m.magasin_source_id = ? OR m.magasin_destination_id = ?)
            AND m.date_mouvement >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY p.id, p.nom, p.unite
            ORDER BY nombre_mouvements DESC
            LIMIT 5
        `, [magasinId, magasinId, parseInt(periode)]);

        res.json({
            success: true,
            data: {
                evolution,
                topProduits
            }
        });

    } catch (error) {
        console.error('Erreur stats magasinier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};