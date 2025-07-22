const express = require('express');
const router = express.Router();
const { authenticate, authorize, checkMagasinAccess } = require('../middleware/auth-mysql');
const db = require('../config/database-mysql');

// Toutes les routes nécessitent une authentification et le rôle operator minimum
router.use(authenticate);
router.use(authorize('operator', 'manager', 'admin'));

// Dashboard statistiques pour opérateur
router.get('/dashboard/operator/stats', checkMagasinAccess, async (req, res) => {
    try {
        const magasinId = req.user.magasin_id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Statistiques du jour
        const [entriesResult] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(quantite), 0) as total
            FROM mouvements_stock 
            WHERE magasin_id = ? AND type = 'entree' AND DATE(date_mouvement) = DATE(?)
        `, [magasinId, today]);

        const [exitsResult] = await db.execute(`
            SELECT COUNT(*) as count, COALESCE(SUM(quantite), 0) as total
            FROM mouvements_stock 
            WHERE magasin_id = ? AND type = 'sortie' AND DATE(date_mouvement) = DATE(?)
        `, [magasinId, today]);

        // Dispatches en attente
        const [pendingDispatches] = await db.execute(`
            SELECT COUNT(*) as count
            FROM dispatches 
            WHERE magasin_destination_id = ? AND statut = 'en_attente'
        `, [magasinId]);

        // Alertes stock bas
        const [lowStockAlerts] = await db.execute(`
            SELECT COUNT(*) as count
            FROM stocks s
            JOIN produits p ON s.produit_id = p.id
            WHERE s.magasin_id = ? AND s.quantite_actuelle <= s.seuil_alerte
        `, [magasinId]);

        res.json({
            success: true,
            data: {
                entries: entriesResult[0].count,
                entriesTotal: entriesResult[0].total,
                exits: exitsResult[0].count,
                exitsTotal: exitsResult[0].total,
                pendingDispatches: pendingDispatches[0].count,
                lowStockAlerts: lowStockAlerts[0].count
            }
        });
    } catch (error) {
        console.error('Erreur stats opérateur:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Stock du magasin de l'opérateur
router.get('/stock/magasin/:magasin_id', checkMagasinAccess, async (req, res) => {
    try {
        const magasinId = req.params.magasin_id || req.user.magasin_id;

        const [stocks] = await db.execute(`
            SELECT 
                s.*,
                p.id as produit_id,
                p.nom as produit_nom,
                p.code as produit_code,
                p.categorie as produit_categorie,
                p.unite as produit_unite,
                p.prix_unitaire as produit_prix_unitaire
            FROM stocks s
            JOIN produits p ON s.produit_id = p.id
            WHERE s.magasin_id = ?
            ORDER BY p.nom
        `, [magasinId]);

        // Formater les résultats
        const formattedStocks = stocks.map(stock => ({
            id: stock.id,
            produit_id: stock.produit_id,
            magasin_id: stock.magasin_id,
            quantite_actuelle: stock.quantite_actuelle,
            quantite_min: stock.quantite_min,
            quantite_max: stock.quantite_max,
            seuil_alerte: stock.seuil_alerte,
            produit: {
                id: stock.produit_id,
                nom: stock.produit_nom,
                code: stock.produit_code,
                categorie: stock.produit_categorie,
                unite: stock.produit_unite,
                prix_unitaire: stock.produit_prix_unitaire
            }
        }));

        res.json({ success: true, data: formattedStocks });
    } catch (error) {
        console.error('Erreur récupération stock:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Mouvements récents du magasin
router.get('/mouvements/recent', checkMagasinAccess, async (req, res) => {
    try {
        const magasinId = req.query.magasin_id || req.user.magasin_id;
        const limit = parseInt(req.query.limit) || 20;

        const [mouvements] = await db.execute(`
            SELECT 
                m.*,
                p.nom as produit_nom,
                p.code as produit_code,
                p.unite as produit_unite,
                u.nom as utilisateur_nom,
                u.prenom as utilisateur_prenom,
                c.nom as client_nom,
                c.entreprise as client_entreprise
            FROM mouvements_stock m
            JOIN produits p ON m.produit_id = p.id
            JOIN utilisateurs u ON m.utilisateur_id = u.id
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.magasin_id = ?
            ORDER BY m.date_mouvement DESC
            LIMIT ?
        `, [magasinId, limit]);

        // Formater les résultats
        const formattedMouvements = mouvements.map(m => ({
            id: m.id,
            type: m.type,
            type_mouvement: m.type_mouvement,
            quantite: m.quantite,
            date_mouvement: m.date_mouvement,
            numero_bon: m.numero_bon,
            notes: m.notes,
            reference: m.reference,
            produit: {
                id: m.produit_id,
                nom: m.produit_nom,
                code: m.produit_code,
                unite: m.produit_unite
            },
            utilisateur: {
                nom: m.utilisateur_nom,
                prenom: m.utilisateur_prenom
            },
            client: m.client_id ? {
                nom: m.client_nom,
                entreprise: m.client_entreprise
            } : null
        }));

        res.json({ success: true, data: formattedMouvements });
    } catch (error) {
        console.error('Erreur récupération mouvements:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Enregistrer une entrée
router.post('/mouvements/entree', checkMagasinAccess, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            produit_id,
            quantite,
            type_mouvement,
            fournisseur,
            numero_bon,
            transporteur,
            notes,
            date_mouvement
        } = req.body;

        // Créer le mouvement
        const [mouvementResult] = await connection.execute(`
            INSERT INTO mouvements_stock (
                type, type_mouvement, produit_id, magasin_id, 
                quantite, utilisateur_id, fournisseur, numero_bon, 
                transporteur, notes, date_mouvement, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            'entree', type_mouvement, produit_id, req.user.magasin_id,
            quantite, req.user.id, fournisseur, numero_bon,
            transporteur, notes, date_mouvement || new Date()
        ]);

        // Mettre à jour le stock
        await connection.execute(`
            UPDATE stocks 
            SET quantite_actuelle = quantite_actuelle + ?,
                updated_at = NOW()
            WHERE produit_id = ? AND magasin_id = ?
        `, [quantite, produit_id, req.user.magasin_id]);

        await connection.commit();

        res.json({
            success: true,
            data: { id: mouvementResult.insertId },
            message: 'Entrée enregistrée avec succès'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Erreur enregistrement entrée:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    } finally {
        connection.release();
    }
});

// Enregistrer une sortie
router.post('/mouvements/sortie', checkMagasinAccess, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            produit_id,
            quantite,
            type_mouvement,
            client_id,
            numero_bon,
            chauffeur_nom,
            numero_camion,
            destination,
            notes,
            date_mouvement
        } = req.body;

        // Vérifier le stock disponible
        const [stockCheck] = await connection.execute(`
            SELECT quantite_actuelle 
            FROM stocks 
            WHERE produit_id = ? AND magasin_id = ?
        `, [produit_id, req.user.magasin_id]);

        if (stockCheck.length === 0 || stockCheck[0].quantite_actuelle < quantite) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'Stock insuffisant'
            });
        }

        // Créer le mouvement
        const [mouvementResult] = await connection.execute(`
            INSERT INTO mouvements_stock (
                type, type_mouvement, produit_id, magasin_id, 
                quantite, utilisateur_id, client_id, numero_bon,
                chauffeur_nom, numero_camion, destination, notes,
                date_mouvement, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            'sortie', type_mouvement, produit_id, req.user.magasin_id,
            quantite, req.user.id, client_id, numero_bon,
            chauffeur_nom, numero_camion, destination, notes,
            date_mouvement || new Date()
        ]);

        // Mettre à jour le stock
        await connection.execute(`
            UPDATE stocks 
            SET quantite_actuelle = quantite_actuelle - ?,
                updated_at = NOW()
            WHERE produit_id = ? AND magasin_id = ?
        `, [quantite, produit_id, req.user.magasin_id]);

        await connection.commit();

        res.json({
            success: true,
            data: { id: mouvementResult.insertId },
            message: 'Sortie enregistrée avec succès'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Erreur enregistrement sortie:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    } finally {
        connection.release();
    }
});

// Dispatches en attente pour le magasin
router.get('/dispatches/pending/:magasin_id', checkMagasinAccess, async (req, res) => {
    try {
        const magasinId = req.params.magasin_id || req.user.magasin_id;

        const [dispatches] = await db.execute(`
            SELECT 
                d.*,
                p.nom as produit_nom,
                p.code as produit_code,
                p.unite as produit_unite,
                n.nom as navire_nom,
                u.nom as dispatcher_nom,
                u.prenom as dispatcher_prenom
            FROM dispatches d
            JOIN produits p ON d.produit_id = p.id
            JOIN navires n ON d.navire_id = n.id
            JOIN utilisateurs u ON d.utilisateur_id = u.id
            WHERE d.magasin_destination_id = ? AND d.statut = 'en_attente'
            ORDER BY d.created_at DESC
        `, [magasinId]);

        // Formater les résultats
        const formattedDispatches = dispatches.map(d => ({
            id: d.id,
            numero_dispatch: d.numero_dispatch,
            quantite: d.quantite,
            statut: d.statut,
            notes: d.notes,
            created_at: d.created_at,
            produit: {
                id: d.produit_id,
                nom: d.produit_nom,
                code: d.produit_code,
                unite: d.produit_unite
            },
            navire: {
                id: d.navire_id,
                nom: d.navire_nom
            },
            dispatcher: {
                nom: d.dispatcher_nom,
                prenom: d.dispatcher_prenom
            }
        }));

        res.json({ success: true, data: formattedDispatches });
    } catch (error) {
        console.error('Erreur récupération dispatches:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Accepter un dispatch
router.post('/dispatches/:id/accept', checkMagasinAccess, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const dispatchId = req.params.id;
        const { notes } = req.body;

        // Récupérer les détails du dispatch
        const [dispatchResult] = await connection.execute(`
            SELECT * FROM dispatches 
            WHERE id = ? AND magasin_destination_id = ? AND statut = 'en_attente'
        `, [dispatchId, req.user.magasin_id]);

        if (dispatchResult.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Dispatch non trouvé ou déjà traité'
            });
        }

        const dispatch = dispatchResult[0];

        // Créer un mouvement d'entrée
        await connection.execute(`
            INSERT INTO mouvements_stock (
                type, type_mouvement, produit_id, magasin_id,
                quantite, utilisateur_id, numero_bon, notes,
                reference, date_mouvement, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            'entree', 'reception_dispatch', dispatch.produit_id, req.user.magasin_id,
            dispatch.quantite, req.user.id, dispatch.numero_dispatch,
            notes || `Réception du dispatch ${dispatch.numero_dispatch}`,
            `DISPATCH-${dispatch.id}`
        ]);

        // Mettre à jour le stock
        await connection.execute(`
            UPDATE stocks 
            SET quantite_actuelle = quantite_actuelle + ?,
                updated_at = NOW()
            WHERE produit_id = ? AND magasin_id = ?
        `, [dispatch.quantite, dispatch.produit_id, req.user.magasin_id]);

        // Mettre à jour le statut du dispatch
        await connection.execute(`
            UPDATE dispatches 
            SET statut = 'receptionne',
                reception_par = ?,
                reception_date = NOW(),
                reception_notes = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [req.user.id, notes, dispatchId]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Dispatch réceptionné avec succès'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Erreur acceptation dispatch:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    } finally {
        connection.release();
    }
});

module.exports = router;