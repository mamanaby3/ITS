const { pool } = require('../config/database-mysql');

exports.getAllClients = async (req, res) => {
    try {
        const { search, actif } = req.query;
        let query = `
            SELECT 
                id,
                code,
                nom,
                type_client,
                email,
                telephone,
                adresse,
                ville,
                pays,
                credit_limite,
                encours_credit,
                actif,
                created_at,
                updated_at
            FROM clients
            WHERE 1=1
        `;
        
        const params = [];
        
        if (search) {
            query += ' AND (nom LIKE ? OR code LIKE ? OR email LIKE ? OR ville LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (actif !== undefined) {
            query += ' AND actif = ?';
            params.push(actif === 'true' ? 1 : 0);
        }
        
        query += ' ORDER BY nom ASC';
        
        const [clients] = await pool.query(query, params);
        
        res.json({ 
            success: true, 
            data: clients 
        });
        
    } catch (error) {
        console.error('Erreur getAllClients:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des clients' 
        });
    }
};

exports.getClientById = async (req, res) => {
    try {
        const [clients] = await pool.query(
            'SELECT * FROM clients WHERE id = ?',
            [req.params.id]
        );
        
        if (clients.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Client non trouvé' 
            });
        }
        
        res.json({ 
            success: true, 
            data: clients[0] 
        });
        
    } catch (error) {
        console.error('Erreur getClientById:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération du client' 
        });
    }
};

exports.createClient = async (req, res) => {
    try {
        const { code, nom, email, telephone, adresse, ville, pays, credit_limite } = req.body;
        
        // Générer un code si non fourni
        const clientCode = code || `CLI-${Date.now()}`;
        
        const [result] = await pool.query(
            `INSERT INTO clients (code, nom, email, telephone, adresse, ville, pays, credit_limite)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientCode, nom, email, telephone, adresse, ville, pays || 'Sénégal', credit_limite || 0]
        );
        
        const [newClient] = await pool.query(
            'SELECT * FROM clients WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            data: newClient[0],
            message: 'Client créé avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur createClient:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Un client avec ce code existe déjà' 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la création du client' 
        });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const { nom, email, telephone, adresse, ville, pays, credit_limite } = req.body;
        
        await pool.query(
            `UPDATE clients 
             SET nom = ?, email = ?, telephone = ?, adresse = ?, 
                 ville = ?, pays = ?, credit_limite = ?
             WHERE id = ?`,
            [nom, email, telephone, adresse, ville, pays, credit_limite, req.params.id]
        );
        
        const [updatedClient] = await pool.query(
            'SELECT * FROM clients WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            data: updatedClient[0],
            message: 'Client mis à jour avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur updateClient:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la mise à jour du client' 
        });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        // Vérifier s'il y a des commandes
        const [commandes] = await pool.query(
            'SELECT COUNT(*) as count FROM commandes WHERE client_id = ?',
            [req.params.id]
        );
        
        if (commandes[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Impossible de supprimer un client avec des commandes' 
            });
        }
        
        await pool.query(
            'UPDATE clients SET actif = 0 WHERE id = ?',
            [req.params.id]
        );
        
        res.json({ 
            success: true, 
            message: 'Client désactivé avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur deleteClient:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la suppression du client' 
        });
    }
};

exports.getClientStats = async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Stats du client
        const [clientStats] = await pool.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT cmd.id) as nb_commandes,
                COALESCE(SUM(cmd.montant_total), 0) as total_commandes,
                (c.credit_limite - c.encours_credit) as credit_disponible
            FROM clients c
            LEFT JOIN commandes cmd ON c.id = cmd.client_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [clientId]);
        
        if (clientStats.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Client non trouvé' 
            });
        }
        
        res.json({ 
            success: true, 
            data: clientStats[0] 
        });
        
    } catch (error) {
        console.error('Erreur getClientStats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
};

exports.getClientsStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_clients,
                COUNT(CASE WHEN actif = 1 THEN 1 END) as clients_actifs,
                SUM(credit_limite) as credit_total,
                SUM(encours_credit) as credit_utilise_total,
                COUNT(DISTINCT ville) as nb_villes
            FROM clients
        `);
        
        const [topClients] = await pool.query(`
            SELECT 
                c.id,
                c.code,
                c.nom,
                c.ville,
                COUNT(cmd.id) as nb_commandes,
                COALESCE(SUM(cmd.montant_total), 0) as total_commandes
            FROM clients c
            LEFT JOIN commandes cmd ON c.id = cmd.client_id
            WHERE c.actif = 1
            GROUP BY c.id
            ORDER BY total_commandes DESC
            LIMIT 5
        `);
        
        res.json({ 
            success: true, 
            data: {
                ...stats[0],
                top_clients: topClients
            }
        });
        
    } catch (error) {
        console.error('Erreur getClientsStats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
};