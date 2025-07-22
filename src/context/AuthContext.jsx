import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth-fixed.js';
import { USER_ROLES } from '../utils/constants.js';

// État initial
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
};

// Actions
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_ERROR: 'LOGIN_ERROR',
    LOGOUT: 'LOGOUT',
    UPDATE_USER: 'UPDATE_USER',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_ERROR:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload }
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

// Création du contexte
const AuthContext = createContext();

// Hook pour utiliser le contexte
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

// Provider
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Vérification de l'authentification au chargement
    useEffect(() => {
        const checkAuth = async () => {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

            try {
                if (authService.isAuthenticated()) {
                    // Récupérer l'utilisateur depuis le localStorage
                    const user = authService.getCurrentUser();
                    if (user) {
                        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
                    } else {
                        dispatch({ type: AUTH_ACTIONS.LOGOUT });
                    }
                } else {
                    dispatch({ type: AUTH_ACTIONS.LOGOUT });
                }
            } catch (error) {
                console.error('Erreur vérification auth:', error);
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
            } finally {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        };

        checkAuth();
    }, []);

    // Fonction de connexion
    const login = async (email, password) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            // Convertir les paramètres séparés en objet credentials
            const credentials = typeof email === 'string' ? { email, password } : email;
            const response = await authService.login(credentials);
            dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
            return response;
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: error.message });
            throw error;
        }
    };

    // Fonction de déconnexion
    const logout = async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await authService.logout();
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Mise à jour des données utilisateur
    const updateUser = (userData) => {
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });

        // Mettre à jour le localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('its_user_data', JSON.stringify(updatedUser));
        }
    };

    // Effacer les erreurs
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    // Vérification des permissions
    const hasPermission = (permission) => {
        if (!state.user) return false;
        return authService.hasPermission(permission);
    };

    // Vérification du rôle
    const hasRole = (role) => {
        if (!state.user) return false;
        return authService.hasRole(role);
    };

    // Vérification de l'accès au magasin
    const canAccessWarehouse = (warehouseId) => {
        if (!state.user) return false;
        return authService.canAccessWarehouse(warehouseId);
    };

    // Vérification de l'accès au magasin (alias)
    const canAccessMagasin = (magasinId) => {
        if (!state.user) return false;
        if (state.user.role === 'manager') return true;
        return state.user.magasins && state.user.magasins.includes(magasinId);
    };

    // Vérification si l'utilisateur est admin (maintenant c'est le manager qui a tous les droits)
    const isAdmin = () => {
        return hasRole(USER_ROLES.MANAGER);
    };

    // Vérification si l'utilisateur est manager
    const isManager = () => {
        return hasRole(USER_ROLES.MANAGER);
    };

    // Vérification si l'utilisateur est opérateur (magasinier)
    const isOperator = () => {
        return hasRole(USER_ROLES.OPERATOR);
    };

    // Vérification si l'utilisateur peut voir tous les magasins
    const canViewAllWarehouses = () => {
        return isAdmin() || isManager();
    };

    // Obtenir le magasin principal de l'utilisateur
    const getUserWarehouse = () => {
        return state.user?.magasin_id || null;
    };

    // Obtenir tous les magasins de l'utilisateur
    const getUserMagasins = () => {
        if (!state.user) return [];
        if (state.user.role === 'manager') return state.user.magasins || [];
        return state.user.magasins || [];
    };

    // Obtenir le magasin actuel (peut être changé dynamiquement)
    const getCurrentMagasin = () => {
        const currentMagasin = localStorage.getItem('its_current_magasin');
        return currentMagasin || getUserWarehouse();
    };

    // Changer le magasin actuel
    const setCurrentMagasin = (magasinId) => {
        if (canAccessMagasin(magasinId)) {
            localStorage.setItem('its_current_magasin', magasinId);
            return true;
        }
        return false;
    };

    // Obtenir le nom complet de l'utilisateur
    const getUserFullName = () => {
        if (!state.user) return '';
        return `${state.user.prenom} ${state.user.nom}`.trim();
    };

    // Valeur du contexte
    const value = {
        // État
        ...state,

        // Actions
        login,
        logout,
        updateUser,
        clearError,

        // Vérifications de permissions
        hasPermission,
        hasRole,
        canAccessWarehouse,
        canAccessMagasin,

        // Helpers de rôles
        isAdmin,
        isManager,
        isOperator,
        canViewAllWarehouses,

        // Helpers utilisateur
        getUserWarehouse,
        getUserMagasins,
        getCurrentMagasin,
        setCurrentMagasin,
        getUserFullName
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Composant de protection par authentification
export const RequireAuth = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Rediriger vers la page de connexion
        window.location.href = '/login';
        return null;
    }

    return children;
};

// Composant de protection par rôle
export const RequireRole = ({ children, roles = [], fallback = null }) => {
    const { hasRole, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="spinner w-6 h-6"></div>
            </div>
        );
    }

    const hasRequiredRole = roles.some(role => hasRole(role));

    if (!hasRequiredRole) {
        if (fallback) return fallback;

        return (
            <div className="text-center p-8">
                <div className="text-red-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès Refusé</h3>
                <p className="text-gray-600">
                    Vous n'avez pas les privilèges nécessaires pour accéder à cette section.
                </p>
            </div>
        );
    }

    return children;
};

// Composant de protection par permission
export const RequirePermission = ({ children, permission, fallback = null }) => {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="spinner w-6 h-6"></div>
            </div>
        );
    }

    if (!hasPermission(permission)) {
        if (fallback) return fallback;

        return (
            <div className="text-center p-8">
                <div className="text-yellow-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Permission Insuffisante</h3>
                <p className="text-gray-600">
                    Cette action nécessite des permissions supplémentaires.
                </p>
            </div>
        );
    }

    return children;
};

export default AuthContext;