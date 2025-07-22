// Service d'authentification utilisant l'API réelle
import api from './api';
import { 
    AUTH_TOKEN_KEY, 
    USER_DATA_KEY, 
    TOKEN_EXPIRY_KEY,
    ROLE_PERMISSIONS 
} from '../utils/constants';

class AuthApiService {
    constructor() {
        this.tokenKey = AUTH_TOKEN_KEY;
        this.userKey = USER_DATA_KEY;
        this.expiryKey = TOKEN_EXPIRY_KEY;
    }

    // Connexion
    async login(email, password) {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data.success && response.data.token) {
                // Stocker le token et les données utilisateur
                this.setAuthData(response.data.token, response.data.user);
                
                // Configurer le token pour les futures requêtes
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                
                return {
                    success: true,
                    user: response.data.user,
                    token: response.data.token
                };
            }
            
            throw new Error(response.data.error || 'Échec de la connexion');
        } catch (error) {
            console.error('Erreur de connexion:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error('Erreur de connexion au serveur');
        }
    }

    // Inscription
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'Inscription réussie'
                };
            }
            
            throw new Error(response.data.error || 'Échec de l\'inscription');
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error('Erreur lors de l\'inscription');
        }
    }

    // Déconnexion
    async logout() {
        try {
            // Nettoyer le stockage local et les headers
            this.clearAuthData();
            delete api.defaults.headers.common['Authorization'];
            
            return { success: true };
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            throw error;
        }
    }

    // Obtenir l'utilisateur actuel
    async getCurrentUser() {
        try {
            const response = await api.get('/auth/me');
            
            if (response.data.success && response.data.user) {
                // Mettre à jour les données utilisateur locales
                const currentUser = this.getCurrentUserData();
                if (currentUser) {
                    const updatedUser = { ...currentUser, ...response.data.user };
                    localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
                }
                
                return response.data.user;
            }
            
            throw new Error('Impossible de récupérer les données utilisateur');
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            
            // Si l'erreur est 401, le token est invalide
            if (error.response?.status === 401) {
                this.clearAuthData();
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            
            throw error;
        }
    }

    // Changer le mot de passe
    async changePassword(oldPassword, newPassword) {
        try {
            const response = await api.put('/auth/password', {
                oldPassword,
                password: newPassword
            });
            
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'Mot de passe modifié avec succès'
                };
            }
            
            throw new Error(response.data.error || 'Échec de la modification du mot de passe');
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw new Error('Erreur lors du changement de mot de passe');
        }
    }

    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        const token = this.getToken();
        const expiry = localStorage.getItem(this.expiryKey);
        
        if (!token || !expiry) {
            return false;
        }
        
        // Vérifier si le token n'est pas expiré
        const now = new Date().getTime();
        const expiryTime = parseInt(expiry);
        
        if (now > expiryTime) {
            this.clearAuthData();
            return false;
        }
        
        return true;
    }

    // Obtenir le token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Obtenir les données utilisateur
    getCurrentUserData() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    // Obtenir le rôle de l'utilisateur
    getUserRole() {
        const user = this.getCurrentUserData();
        return user?.role || null;
    }

    // Obtenir les permissions de l'utilisateur
    getUserPermissions() {
        const role = this.getUserRole();
        return role ? ROLE_PERMISSIONS[role] || [] : [];
    }

    // Vérifier si l'utilisateur a une permission
    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes(permission);
    }

    // Vérifier si l'utilisateur a l'un des rôles
    hasRole(...roles) {
        const userRole = this.getUserRole();
        return roles.includes(userRole);
    }

    // Stocker les données d'authentification
    setAuthData(token, user) {
        // Calculer l'expiration (24h par défaut)
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        localStorage.setItem(this.expiryKey, expiryTime.toString());
        
        // Configurer le token pour les futures requêtes
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Nettoyer les données d'authentification
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.expiryKey);
        delete api.defaults.headers.common['Authorization'];
    }

    // Rafraîchir le token (si implémenté côté serveur)
    async refreshToken() {
        try {
            const response = await api.post('/auth/refresh');
            
            if (response.data.success && response.data.token) {
                const user = this.getCurrentUserData();
                this.setAuthData(response.data.token, user);
                return response.data.token;
            }
            
            throw new Error('Impossible de rafraîchir le token');
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            this.clearAuthData();
            throw error;
        }
    }
}

export default new AuthApiService();