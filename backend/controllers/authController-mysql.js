const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database-mysql');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis'
            });
        }
        
        // Rechercher l'utilisateur
        const [users] = await pool.query(
            'SELECT * FROM utilisateurs WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }
        
        // Vérifier si l'utilisateur est actif
        if (!user.actif) {
            return res.status(401).json({
                success: false,
                error: 'Compte désactivé'
            });
        }
        
        // Générer le token JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || '1UGVjL9bbqFo7GpL35ttj0R58H5zgKSw5voG3bLLwXU=',
            { expiresIn: '24h' }
        );
        
        // Mettre à jour la dernière connexion
        await pool.query(
            'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Retourner les informations utilisateur
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    role: user.role,
                    magasin_id: user.magasin_id
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur',
            details: error.message
        });
    }
};

// Récupérer les informations de l'utilisateur connecté
exports.me = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    nom: req.user.nom,
                    prenom: req.user.prenom,
                    role: req.user.role,
                    magasin_id: req.user.magasin_id
                }
            }
        });
    } catch (error) {
        console.error('Erreur me:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
};

// Déconnexion (côté client principalement)
exports.logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur logout:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
};

// Changer le mot de passe
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        // Récupérer l'utilisateur actuel
        const [users] = await pool.query(
            'SELECT password_hash FROM utilisateurs WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
        
        const user = users[0];
        
        // Vérifier l'ancien mot de passe
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Mot de passe actuel incorrect'
            });
        }
        
        // Hasher le nouveau mot de passe
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Mettre à jour le mot de passe
        await pool.query(
            'UPDATE utilisateurs SET password_hash = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );
        
        res.json({
            success: true,
            message: 'Mot de passe mis à jour avec succès'
        });
        
    } catch (error) {
        console.error('Erreur updatePassword:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
};

// Inscription d'un nouvel utilisateur (réservée aux managers)
exports.register = async (req, res) => {
    try {
        const { email, password, nom, prenom, role, magasin_id } = req.body;
        
        // Vérifier si l'email existe déjà
        const [existingUsers] = await pool.query(
            'SELECT id FROM utilisateurs WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cet email est déjà utilisé'
            });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const [result] = await pool.query(
            'INSERT INTO utilisateurs (email, password_hash, nom, prenom, role, magasin_id, actif, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
            [email, hashedPassword, nom, prenom, role, magasin_id]
        );
        
        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    id: result.insertId,
                    email,
                    nom,
                    prenom,
                    role,
                    magasin_id
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
};