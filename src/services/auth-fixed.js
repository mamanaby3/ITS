// Service d'authentification simplifié - FORCE l'utilisation de l'API réelle
import axios from 'axios';

// Configuration directe de l'API
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'its_auth_token';
const USER_DATA_KEY = 'its_user_data';

// Instance axios configurée
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Gestion du token
const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
    }
};

// Initialiser le token
const token = getAuthToken();
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Service d'authentification simplifié
export const authService = {
    // Connexion - FORCE l'utilisation de l'API réelle
    login: async (credentials) => {
        console.log('🔐 [AUTH-FIXED] Connexion à l\'API réelle:', API_BASE_URL);
        console.log('📧 [AUTH-FIXED] Email:', credentials.email);
        
        try {
            const response = await api.post('/auth/login', credentials);
            console.log('✅ [AUTH-FIXED] Réponse API:', response.data);

            if (response.data.success && response.data.token && response.data.user) {
                setAuthToken(response.data.token);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
                
                console.log('✅ [AUTH-FIXED] Token sauvegardé');
                return {
                    token: response.data.token,
                    user: response.data.user
                };
            } else {
                throw new Error(response.data.error || 'Réponse API invalide');
            }
        } catch (error) {
            console.error('❌ [AUTH-FIXED] Erreur connexion:', error);
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', error.response.data);
                throw new Error(error.response.data?.error || `Erreur HTTP ${error.response.status}`);
            } else if (error.request) {
                console.error('   Pas de réponse du serveur');
                throw new Error('Serveur non accessible. Vérifiez que le backend est démarré.');
            } else {
                throw new Error(error.message);
            }
        }
    },

    // Déconnexion
    logout: async () => {
        console.log('🚪 [AUTH-FIXED] Déconnexion');
        setAuthToken(null);
        localStorage.removeItem(USER_DATA_KEY);
    },

    // Récupération utilisateur actuel
    getCurrentUser: () => {
        try {
            const userData = localStorage.getItem(USER_DATA_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Erreur parsing données utilisateur:', error);
            return null;
        }
    },

    // Vérification de l'authentification
    isAuthenticated: () => {
        const token = getAuthToken();
        const user = authService.getCurrentUser();
        return !!(token && user);
    },

    // Vérification du rôle
    hasRole: (role) => {
        const user = authService.getCurrentUser();
        return user && user.role === role;
    },

    // Vérification de plusieurs rôles
    hasAnyRole: (roles) => {
        const user = authService.getCurrentUser();
        return user && roles.includes(user.role);
    },

    // Vérification des permissions
    hasPermission: (permission) => {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        // Les admins et managers ont toutes les permissions
        if (user.role === 'admin' || user.role === 'manager') return true;
        
        // Vérifier les permissions spécifiques de l'utilisateur
        return user.permissions && user.permissions.includes(permission);
    },

    // Vérification de plusieurs permissions
    hasAnyPermission: (permissions) => {
        const user = authService.getCurrentUser();
        if (!user) return false;
        
        // Les admins et managers ont toutes les permissions
        if (user.role === 'admin' || user.role === 'manager') return true;
        
        // Vérifier si l'utilisateur a au moins une des permissions
        return user.permissions && permissions.some(p => user.permissions.includes(p));
    },

    // API Request helper
    apiRequest: {
        get: async (url) => {
            const response = await api.get(url);
            return response.data;
        },
        
        post: async (url, data) => {
            const response = await api.post(url, data);
            return response.data;
        }
    }
};

// Export par défaut
export default authService;