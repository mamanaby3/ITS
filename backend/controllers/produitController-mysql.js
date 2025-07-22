const { pool } = require('../config/database-mysql');

exports.getAllProduits = async (req, res) => {
    try {
        const { categorie, search, with_stock } = req.query;
        let query = `
            SELECT 
                p.id,
                p.reference,
                p.nom,
                p.categorie,
                p.description,
                p.unite,
                p.prix_unitaire,
                p.seuil_alerte,
                p.created_at,
                p.updated_at
            FROM produits p
            WHERE 1=1
        `;
        
        const params = [];
        
        if (categorie) {
            query += ' AND p.categorie = ?';
            params.push(categorie);
        }
        
        if (search) {
            query += ' AND (p.nom LIKE ? OR p.reference LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY p.nom ASC';
        
        const [produits] = await pool.query(query, params);
        
        // Si with_stock est demandé, récupérer aussi les infos de stock
        if (with_stock === 'true') {
            for (let produit of produits) {
                const [stocks] = await pool.query(
                    `SELECT 
                        s.magasin_id,
                        m.nom as magasin_nom,
                        s.quantite,
                        s.emplacement
                    FROM stock s
                    JOIN magasins m ON s.magasin_id = m.id
                    WHERE s.produit_id = ?`,
                    [produit.id]
                );
                produit.stocks = stocks;
                produit.stock_total = stocks.reduce((sum, s) => sum + parseFloat(s.quantite || 0), 0);
            }
        }
        
        res.json({ 
            success: true, 
            data: produits 
        });
        
    } catch (error) {
        console.error('Erreur getAllProduits:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des produits',
            details: error.message 
        });
    }
};

exports.getProduitById = async (req, res) => {
    try {
        const [produits] = await pool.query(
            'SELECT * FROM produits WHERE id = ?',
            [req.params.id]
        );
        
        if (produits.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Produit non trouvé' 
            });
        }
        
        const produit = produits[0];
        
        // Récupérer les stocks
        const [stocks] = await pool.query(
            `SELECT 
                s.*,
                m.nom as magasin_nom
            FROM stock s
            JOIN magasins m ON s.magasin_id = m.id
            WHERE s.produit_id = ?`,
            [produit.id]
        );
        
        produit.stocks = stocks;
        
        res.json({ 
            success: true, 
            data: produit 
        });
        
    } catch (error) {
        console.error('Erreur getProduitById:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération du produit' 
        });
    }
};

exports.createProduit = async (req, res) => {
    try {
        const { reference, nom, categorie, description, unite, prix_unitaire, seuil_alerte } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO produits (reference, nom, categorie, description, unite, prix_unitaire, seuil_alerte)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [reference, nom, categorie, description, unite || 'tonnes', prix_unitaire, seuil_alerte || 100]
        );
        
        const [newProduit] = await pool.query(
            'SELECT * FROM produits WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            data: newProduit[0],
            message: 'Produit créé avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur createProduit:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Un produit avec cette référence existe déjà' 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la création du produit' 
        });
    }
};

exports.updateProduit = async (req, res) => {
    try {
        const { nom, categorie, description, unite, prix_unitaire, seuil_alerte } = req.body;
        
        await pool.query(
            `UPDATE produits 
             SET nom = ?, categorie = ?, description = ?, unite = ?, 
                 prix_unitaire = ?, seuil_alerte = ?
             WHERE id = ?`,
            [nom, categorie, description, unite, prix_unitaire, seuil_alerte, req.params.id]
        );
        
        const [updatedProduit] = await pool.query(
            'SELECT * FROM produits WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            data: updatedProduit[0],
            message: 'Produit mis à jour avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur updateProduit:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la mise à jour du produit' 
        });
    }
};

exports.deleteProduit = async (req, res) => {
    try {
        // Vérifier s'il y a du stock
        const [stocks] = await pool.query(
            'SELECT SUM(quantite) as total FROM stock WHERE produit_id = ?',
            [req.params.id]
        );
        
        if (stocks[0].total > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Impossible de supprimer un produit avec du stock' 
            });
        }
        
        await pool.query(
            'DELETE FROM produits WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            message: 'Produit supprimé avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur deleteProduit:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la suppression du produit' 
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT DISTINCT categorie FROM produits ORDER BY categorie'
        );
        
        res.json({ 
            success: true, 
            data: categories.map(c => c.categorie) 
        });
        
    } catch (error) {
        console.error('Erreur getCategories:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des catégories' 
        });
    }
};

exports.getProduitsWithStock = async (req, res) => {
    try {
        const [produits] = await pool.query(`
            SELECT 
                p.*,
                COALESCE(SUM(s.quantite), 0) as stock_total,
                COUNT(DISTINCT s.magasin_id) as nb_magasins
            FROM produits p
            LEFT JOIN stock s ON p.id = s.produit_id
            GROUP BY p.id
            ORDER BY p.nom
        `);
        
        res.json({ 
            success: true, 
            data: produits 
        });
        
    } catch (error) {
        console.error('Erreur getProduitsWithStock:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des produits avec stock' 
        });
    }
};

exports.getProduitsStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(DISTINCT p.id) as total_produits,
                COUNT(DISTINCT p.categorie) as total_categories,
                COALESCE(SUM(s.quantite), 0) as stock_total,
                COALESCE(SUM(s.quantite * p.prix_unitaire), 0) as valeur_totale
            FROM produits p
            LEFT JOIN stock s ON p.id = s.produit_id
        `);
        
        const [categories] = await pool.query(`
            SELECT 
                p.categorie,
                COUNT(DISTINCT p.id) as nb_produits,
                COALESCE(SUM(s.quantite), 0) as stock_total
            FROM produits p
            LEFT JOIN stock s ON p.id = s.produit_id
            GROUP BY p.categorie
        `);
        
        res.json({ 
            success: true, 
            data: {
                ...stats[0],
                categories
            }
        });
        
    } catch (error) {
        console.error('Erreur getProduitsStats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
};