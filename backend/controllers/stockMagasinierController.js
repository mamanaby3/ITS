const db = require('../config/database-mysql');

// Obtenir le stock du jour pour un magasin
exports.getStockJour = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const { date } = req.query;
        const dateStock = date || new Date().toISOString().split('T')[0];
        
        const [stocks] = await db.execute(`
            SELECT 
                sm.*,
                p.nom as produit_nom,
                p.reference as produit_reference,
                p.unite,
                m.nom as magasin_nom,
                (sm.stock_initial + sm.entrees + sm.quantite_dispatchee - sm.sorties) as stock_final_calcule
            FROM stock_magasinier sm
            JOIN produits p ON sm.produit_id = p.id
            JOIN magasins m ON sm.magasin_id = m.id
            WHERE sm.magasin_id = ? AND sm.date_mouvement = ?
            ORDER BY p.nom
        `, [magasinId, dateStock]);
        
        res.json({
            success: true,
            date: dateStock,
            data: stocks
        });
    } catch (error) {
        console.error('Erreur récupération stock jour:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du stock'
        });
    }
};

// Initialiser le stock du jour
exports.initialiserStockJour = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const dateJour = new Date().toISOString().split('T')[0];
        
        // Appeler la procédure stockée
        await db.execute('CALL initialiser_stock_jour(?, ?)', [magasinId, dateJour]);
        
        res.json({
            success: true,
            message: 'Stock du jour initialisé avec succès'
        });
    } catch (error) {
        console.error('Erreur initialisation stock:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'initialisation du stock'
        });
    }
};

// Enregistrer une entrée
exports.enregistrerEntree = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const { produit_id, quantite } = req.body;
        const userId = req.user.id;
        
        if (!produit_id || !quantite || quantite <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Produit et quantité valide requis'
            });
        }
        
        // Appeler la procédure stockée
        await db.execute(
            'CALL enregistrer_entree_stock(?, ?, ?, ?)', 
            [magasinId, produit_id, quantite, userId]
        );
        
        // Enregistrer aussi dans la table mouvements pour la traçabilité
        await db.execute(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_destination_id, quantite, 
                reference_document, date_mouvement, created_by, description
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, ['entree', produit_id, magasinId, quantite, `ENT-${Date.now()}`, userId, 'Entrée confirmée par magasinier']);
        
        res.json({
            success: true,
            message: 'Entrée enregistrée avec succès'
        });
    } catch (error) {
        console.error('Erreur enregistrement entrée:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de l\'enregistrement de l\'entrée'
        });
    }
};

// Enregistrer une sortie
exports.enregistrerSortie = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const { produit_id, quantite, client_id, numero_livraison } = req.body;
        const userId = req.user.id;
        
        if (!produit_id || !quantite || quantite <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Produit et quantité valide requis'
            });
        }
        
        // Appeler la procédure stockée
        await db.execute(
            'CALL enregistrer_sortie_stock(?, ?, ?, ?)', 
            [magasinId, produit_id, quantite, userId]
        );
        
        // Enregistrer aussi dans la table mouvements pour la traçabilité
        await db.execute(`
            INSERT INTO mouvements_stock (
                type_mouvement, produit_id, magasin_source_id, quantite, 
                reference_document, date_mouvement, created_by, description
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            'sortie', 
            produit_id, 
            magasinId, 
            quantite, 
            numero_livraison || `SOR-${Date.now()}`, 
            userId,
            client_id ? `Livraison au client ID: ${client_id}` : null
        ]);
        
        res.json({
            success: true,
            message: 'Sortie enregistrée avec succès'
        });
    } catch (error) {
        console.error('Erreur enregistrement sortie:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de l\'enregistrement de la sortie'
        });
    }
};

// Obtenir le résumé du stock
exports.getResumeStock = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const { date_debut, date_fin } = req.query;
        
        const dateDebut = date_debut || new Date().toISOString().split('T')[0];
        const dateFin = date_fin || new Date().toISOString().split('T')[0];
        
        const [resume] = await db.execute(`
            SELECT 
                p.nom as produit_nom,
                p.unite,
                SUM(sm.stock_initial) as total_stock_initial,
                SUM(sm.entrees) as total_entrees,
                SUM(sm.quantite_dispatchee) as total_dispatches,
                SUM(sm.sorties) as total_sorties,
                (
                    SELECT stock_final 
                    FROM stock_magasinier sm2 
                    WHERE sm2.magasin_id = sm.magasin_id 
                    AND sm2.produit_id = sm.produit_id 
                    AND sm2.date_mouvement = ?
                ) as stock_final_actuel
            FROM stock_magasinier sm
            JOIN produits p ON sm.produit_id = p.id
            WHERE sm.magasin_id = ? 
            AND sm.date_mouvement BETWEEN ? AND ?
            GROUP BY sm.produit_id, p.nom, p.unite
            ORDER BY p.nom
        `, [dateFin, magasinId, dateDebut, dateFin]);
        
        res.json({
            success: true,
            periode: { debut: dateDebut, fin: dateFin },
            data: resume
        });
    } catch (error) {
        console.error('Erreur récupération résumé:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération du résumé'
        });
    }
};

// Obtenir l'historique des mouvements
exports.getHistoriqueMouvements = async (req, res) => {
    try {
        const { magasinId } = req.params;
        const { date_debut, date_fin, produit_id } = req.query;
        
        let query = `
            SELECT 
                sm.*,
                p.nom as produit_nom,
                p.reference as produit_reference,
                p.unite,
                (sm.stock_initial + sm.entrees + sm.quantite_dispatchee - sm.sorties) as stock_final_calcule
            FROM stock_magasinier sm
            JOIN produits p ON sm.produit_id = p.id
            WHERE sm.magasin_id = ?
        `;
        
        const params = [magasinId];
        
        if (date_debut && date_fin) {
            query += ' AND sm.date_mouvement BETWEEN ? AND ?';
            params.push(date_debut, date_fin);
        }
        
        if (produit_id) {
            query += ' AND sm.produit_id = ?';
            params.push(produit_id);
        }
        
        query += ' ORDER BY sm.date_mouvement DESC, p.nom';
        
        const [historique] = await db.execute(query, params);
        
        res.json({
            success: true,
            data: historique
        });
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de l\'historique'
        });
    }
};