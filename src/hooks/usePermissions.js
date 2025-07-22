import { useAuth } from './useAuth';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../utils/constants';

/**
 * Hook pour gérer les permissions utilisateur
 */
export const usePermissions = () => {
    const { user, hasPermission: authHasPermission, hasRole, isAdmin } = useAuth();

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     */
    const hasPermission = (permission) => {
        if (!user) return false;
        return authHasPermission(permission);
    };

    /**
     * Vérifie si l'utilisateur a toutes les permissions spécifiées
     */
    const hasAllPermissions = (permissions = []) => {
        if (!user || !Array.isArray(permissions)) return false;
        return permissions.every(permission => hasPermission(permission));
    };

    /**
     * Vérifie si l'utilisateur a au moins une des permissions spécifiées
     */
    const hasAnyPermission = (permissions = []) => {
        if (!user || !Array.isArray(permissions)) return false;
        return permissions.some(permission => hasPermission(permission));
    };

    /**
     * Obtient toutes les permissions de l'utilisateur
     */
    const getUserPermissions = () => {
        if (!user || !user.role) return [];
        return ROLE_PERMISSIONS[user.role] || [];
    };

    /**
     * Vérifie les permissions pour les opérations CRUD
     */
    const canCreate = (resource) => hasPermission(`${resource}.create`);
    const canRead = (resource) => hasPermission(`${resource}.read`);
    const canUpdate = (resource) => hasPermission(`${resource}.update`);
    const canDelete = (resource) => hasPermission(`${resource}.delete`);

    /**
     * Permissions spécifiques aux utilisateurs
     */
    const canManageUsers = () => hasPermission(PERMISSIONS.USERS_CREATE);
    const canViewUsers = () => hasPermission(PERMISSIONS.USERS_READ);
    const canEditUsers = () => hasPermission(PERMISSIONS.USERS_UPDATE);
    const canDeleteUsers = () => hasPermission(PERMISSIONS.USERS_DELETE);
    const canManageRoles = () => hasPermission(PERMISSIONS.USERS_MANAGE_ROLES);
    const canResetPasswords = () => hasPermission(PERMISSIONS.USERS_RESET_PASSWORD);

    /**
     * Permissions spécifiques au stock
     */
    const canManageStock = () => hasAnyPermission([
        PERMISSIONS.STOCK_CREATE,
        PERMISSIONS.STOCK_UPDATE,
        PERMISSIONS.STOCK_DELETE
    ]);
    const canViewStock = () => hasPermission(PERMISSIONS.STOCK_READ);
    const canValidateStock = () => hasPermission(PERMISSIONS.STOCK_VALIDATE);
    const canTransferStock = () => hasPermission(PERMISSIONS.STOCK_TRANSFER);
    const canAdjustStock = () => hasPermission(PERMISSIONS.STOCK_ADJUST);
    const canExportStock = () => hasPermission(PERMISSIONS.STOCK_EXPORT);

    /**
     * Permissions spécifiques aux produits
     */
    const canManageProducts = () => hasAnyPermission([
        PERMISSIONS.PRODUITS_CREATE,
        PERMISSIONS.PRODUITS_UPDATE,
        PERMISSIONS.PRODUITS_DELETE
    ]);
    const canViewProducts = () => hasPermission(PERMISSIONS.PRODUITS_READ);
    const canManageCategories = () => hasPermission(PERMISSIONS.PRODUITS_MANAGE_CATEGORIES);
    const canImportProducts = () => hasPermission(PERMISSIONS.PRODUITS_IMPORT);
    const canExportProducts = () => hasPermission(PERMISSIONS.PRODUITS_EXPORT);

    /**
     * Permissions spécifiques aux clients
     */
    const canManageClients = () => hasAnyPermission([
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CLIENTS_UPDATE,
        PERMISSIONS.CLIENTS_DELETE
    ]);
    const canViewClients = () => hasPermission(PERMISSIONS.CLIENTS_READ);
    const canViewClientFinancials = () => hasPermission(PERMISSIONS.CLIENTS_VIEW_FINANCIAL);
    const canExportClients = () => hasPermission(PERMISSIONS.CLIENTS_EXPORT);

    /**
     * Permissions spécifiques aux commandes
     */
    const canManageOrders = () => hasAnyPermission([
        PERMISSIONS.COMMANDES_CREATE,
        PERMISSIONS.COMMANDES_UPDATE,
        PERMISSIONS.COMMANDES_DELETE
    ]);
    const canViewOrders = () => hasPermission(PERMISSIONS.COMMANDES_READ);
    const canValidateOrders = () => hasPermission(PERMISSIONS.COMMANDES_VALIDATE);
    const canCancelOrders = () => hasPermission(PERMISSIONS.COMMANDES_CANCEL);
    const canViewOrderPrices = () => hasPermission(PERMISSIONS.COMMANDES_VIEW_PRICES);
    const canExportOrders = () => hasPermission(PERMISSIONS.COMMANDES_EXPORT);

    /**
     * Permissions spécifiques aux livraisons
     */
    const canManageDeliveries = () => hasAnyPermission([
        PERMISSIONS.LIVRAISONS_CREATE,
        PERMISSIONS.LIVRAISONS_UPDATE,
        PERMISSIONS.LIVRAISONS_DELETE,
        PERMISSIONS.LIVRAISONS_MANAGE
    ]);
    const canViewDeliveries = () => hasPermission(PERMISSIONS.LIVRAISONS_READ);
    const canTrackDeliveries = () => hasPermission(PERMISSIONS.LIVRAISONS_TRACK);
    const canPrintDeliveries = () => hasPermission(PERMISSIONS.LIVRAISONS_PRINT);

    /**
     * Permissions spécifiques aux camions
     */
    const canManageTrucks = () => hasAnyPermission([
        PERMISSIONS.CAMIONS_CREATE,
        PERMISSIONS.CAMIONS_UPDATE,
        PERMISSIONS.CAMIONS_DELETE
    ]);
    const canViewTrucks = () => hasPermission(PERMISSIONS.CAMIONS_READ);
    const canAssignTrucks = () => hasPermission(PERMISSIONS.CAMIONS_ASSIGN);

    /**
     * Permissions spécifiques aux magasins
     */
    const canManageWarehouses = () => hasAnyPermission([
        PERMISSIONS.MAGASINS_CREATE,
        PERMISSIONS.MAGASINS_UPDATE,
        PERMISSIONS.MAGASINS_DELETE
    ]);
    const canViewWarehouses = () => hasPermission(PERMISSIONS.MAGASINS_READ);
    const canAccessAllWarehouses = () => hasPermission(PERMISSIONS.MAGASINS_ACCESS_ALL);

    /**
     * Permissions spécifiques aux rapports
     */
    const canViewReports = () => hasAnyPermission([
        PERMISSIONS.RAPPORTS_STOCK,
        PERMISSIONS.RAPPORTS_FINANCIAL,
        PERMISSIONS.RAPPORTS_OPERATIONAL,
        PERMISSIONS.RAPPORTS_LIVRAISONS,
        PERMISSIONS.RAPPORTS_ALL
    ]);
    const canViewStockReports = () => hasPermission(PERMISSIONS.RAPPORTS_STOCK);
    const canViewFinancialReports = () => hasPermission(PERMISSIONS.RAPPORTS_FINANCIAL);
    const canViewOperationalReports = () => hasPermission(PERMISSIONS.RAPPORTS_OPERATIONAL);
    const canViewDeliveryReports = () => hasPermission(PERMISSIONS.RAPPORTS_LIVRAISONS);
    const canViewAllReports = () => hasPermission(PERMISSIONS.RAPPORTS_ALL);
    const canExportReports = () => hasPermission(PERMISSIONS.RAPPORTS_EXPORT);

    /**
     * Permissions spécifiques au dashboard
     */
    const canViewDashboard = () => hasPermission(PERMISSIONS.DASHBOARD_VIEW);
    const canViewDashboardStats = () => hasPermission(PERMISSIONS.DASHBOARD_STATS);
    const canViewDashboardAlerts = () => hasPermission(PERMISSIONS.DASHBOARD_ALERTS);

    /**
     * Permissions système
     */
    const canManageSettings = () => hasPermission(PERMISSIONS.SETTINGS_MANAGE);
    const canBackupSystem = () => hasPermission(PERMISSIONS.SETTINGS_BACKUP);
    const canViewSystemLogs = () => hasPermission(PERMISSIONS.SYSTEM_LOGS);
    const canManageMaintenance = () => hasPermission(PERMISSIONS.SYSTEM_MAINTENANCE);

    /**
     * Vérifie si l'utilisateur peut accéder à une page
     */
    const canAccessPage = (page) => {
        const pagePermissions = {
            dashboard: [PERMISSIONS.DASHBOARD_VIEW],
            stock: [PERMISSIONS.STOCK_READ],
            produits: [PERMISSIONS.PRODUITS_READ],
            clients: [PERMISSIONS.CLIENTS_READ],
            commandes: [PERMISSIONS.COMMANDES_READ],
            livraisons: [PERMISSIONS.LIVRAISONS_READ],
            rapports: [
                PERMISSIONS.RAPPORTS_STOCK,
                PERMISSIONS.RAPPORTS_FINANCIAL,
                PERMISSIONS.RAPPORTS_OPERATIONAL,
                PERMISSIONS.RAPPORTS_LIVRAISONS,
                PERMISSIONS.RAPPORTS_ALL
            ],
            users: [PERMISSIONS.USERS_READ],
            settings: [PERMISSIONS.SETTINGS_MANAGE]
        };

        const requiredPermissions = pagePermissions[page];
        if (!requiredPermissions) return true; // Page sans restriction

        return hasAnyPermission(requiredPermissions);
    };

    /**
     * Filtrer les éléments de menu selon les permissions
     */
    const getAccessibleMenuItems = (menuItems) => {
        return menuItems.filter(item => {
            if (!item.permission) return true;
            return hasPermission(item.permission);
        });
    };

    return {
        // Vérifications de base
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        getUserPermissions,

        // CRUD générique
        canCreate,
        canRead,
        canUpdate,
        canDelete,

        // Permissions utilisateurs
        canManageUsers,
        canViewUsers,
        canEditUsers,
        canDeleteUsers,
        canManageRoles,
        canResetPasswords,

        // Permissions stock
        canManageStock,
        canViewStock,
        canValidateStock,
        canTransferStock,
        canAdjustStock,
        canExportStock,

        // Permissions produits
        canManageProducts,
        canViewProducts,
        canManageCategories,
        canImportProducts,
        canExportProducts,

        // Permissions clients
        canManageClients,
        canViewClients,
        canViewClientFinancials,
        canExportClients,

        // Permissions commandes
        canManageOrders,
        canViewOrders,
        canValidateOrders,
        canCancelOrders,
        canViewOrderPrices,
        canExportOrders,

        // Permissions livraisons
        canManageDeliveries,
        canViewDeliveries,
        canTrackDeliveries,
        canPrintDeliveries,

        // Permissions camions
        canManageTrucks,
        canViewTrucks,
        canAssignTrucks,

        // Permissions magasins
        canManageWarehouses,
        canViewWarehouses,
        canAccessAllWarehouses,

        // Permissions rapports
        canViewReports,
        canViewStockReports,
        canViewFinancialReports,
        canViewOperationalReports,
        canViewDeliveryReports,
        canViewAllReports,
        canExportReports,

        // Permissions dashboard
        canViewDashboard,
        canViewDashboardStats,
        canViewDashboardAlerts,

        // Permissions système
        canManageSettings,
        canBackupSystem,
        canViewSystemLogs,
        canManageMaintenance,

        // Utilitaires
        canAccessPage,
        getAccessibleMenuItems,

        // État utilisateur
        user,
        isAdmin
    };
};

export default usePermissions;