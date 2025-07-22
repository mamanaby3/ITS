import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

/**
 * Hook personnalisé pour l'authentification
 * Facilite l'utilisation du contexte d'authentification
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }

    return context;
};

/**
 * Hook pour vérifier si l'utilisateur a un rôle spécifique
 */
export const useRole = (role) => {
    const { hasRole } = useAuth();
    return hasRole(role);
};

/**
 * Hook pour vérifier si l'utilisateur a une permission spécifique
 */
export const usePermission = (permission) => {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
};

/**
 * Hook pour les actions d'authentification
 */
export const useAuthActions = () => {
    const { login, logout, updateUser, clearError } = useAuth();

    return {
        login,
        logout,
        updateUser,
        clearError
    };
};

/**
 * Hook pour obtenir les informations utilisateur
 */
export const useUser = () => {
    const { user, getUserFullName, getUserWarehouse } = useAuth();

    return {
        user,
        fullName: getUserFullName(),
        warehouseId: getUserWarehouse(),
        isLoggedIn: !!user
    };
};

/**
 * Hook pour les vérifications de rôles ITS spécifiques
 */
export const useITSRoles = () => {
    const { isAdmin, isManager, isOperator, canViewAllWarehouses } = useAuth();

    return {
        isAdmin: isAdmin(),
        isManager: isManager(),
        isOperator: isOperator(),
        canViewAllWarehouses: canViewAllWarehouses(),
        isManagement: isAdmin() || isManager(), // Admin ou Manager
        canManageStock: isAdmin() || isManager() || isOperator() // Peut gérer le stock
    };
};

export default useAuth;