// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000; // 30 secondes
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Authentification
export const AUTH_TOKEN_KEY = 'its_auth_token';
export const USER_DATA_KEY = 'its_user_data';
export const TOKEN_EXPIRY_KEY = 'its_token_expiry';

// Rôles utilisateurs
export const USER_ROLES = {
    MANAGER: 'manager',
    OPERATOR: 'operator'
};

export const ROLE_LABELS = {
    [USER_ROLES.MANAGER]: 'Manager / Administrateur',
    [USER_ROLES.OPERATOR]: 'Chef de Magasin'
};

// Définition complète des permissions
export const PERMISSIONS = {
    // Permissions utilisateurs
    USERS_CREATE: 'users.create',
    USERS_READ: 'users.read',
    USERS_UPDATE: 'users.update',
    USERS_DELETE: 'users.delete',
    USERS_MANAGE_ROLES: 'users.manage_roles',
    USERS_RESET_PASSWORD: 'users.reset_password',

    // Permissions magasins
    MAGASINS_CREATE: 'magasins.create',
    MAGASINS_READ: 'magasins.read',
    MAGASINS_UPDATE: 'magasins.update',
    MAGASINS_DELETE: 'magasins.delete',
    MAGASINS_ACCESS_ALL: 'magasins.access_all',

    // Permissions stock
    STOCK_CREATE: 'stock.create',
    STOCK_READ: 'stock.read',
    STOCK_UPDATE: 'stock.update',
    STOCK_DELETE: 'stock.delete',
    STOCK_VALIDATE: 'stock.validate',
    STOCK_TRANSFER: 'stock.transfer',
    STOCK_ADJUST: 'stock.adjust',
    STOCK_EXPORT: 'stock.export',
    STOCK_DISPATCH: 'stock.dispatch',
    
    // Permissions réception navires
    NAVIRES_RECEPTION: 'navires.reception',
    NAVIRES_DISPATCH: 'navires.dispatch',
    NAVIRES_TRACK: 'navires.track',

    // Permissions produits
    PRODUITS_CREATE: 'produits.create',
    PRODUITS_READ: 'produits.read',
    PRODUITS_UPDATE: 'produits.update',
    PRODUITS_DELETE: 'produits.delete',
    PRODUITS_MANAGE_CATEGORIES: 'produits.manage_categories',
    PRODUITS_IMPORT: 'produits.import',
    PRODUITS_EXPORT: 'produits.export',

    // Permissions clients
    CLIENTS_CREATE: 'clients.create',
    CLIENTS_READ: 'clients.read',
    CLIENTS_UPDATE: 'clients.update',
    CLIENTS_DELETE: 'clients.delete',
    CLIENTS_EXPORT: 'clients.export',
    CLIENTS_VIEW_FINANCIAL: 'clients.view_financial',

    // Permissions commandes
    COMMANDES_CREATE: 'commandes.create',
    COMMANDES_READ: 'commandes.read',
    COMMANDES_UPDATE: 'commandes.update',
    COMMANDES_DELETE: 'commandes.delete',
    COMMANDES_VALIDATE: 'commandes.validate',
    COMMANDES_CANCEL: 'commandes.cancel',
    COMMANDES_EXPORT: 'commandes.export',
    COMMANDES_VIEW_PRICES: 'commandes.view_prices',

    // Permissions livraisons
    LIVRAISONS_CREATE: 'livraisons.create',
    LIVRAISONS_READ: 'livraisons.read',
    LIVRAISONS_UPDATE: 'livraisons.update',
    LIVRAISONS_DELETE: 'livraisons.delete',
    LIVRAISONS_MANAGE: 'livraisons.manage',
    LIVRAISONS_TRACK: 'livraisons.track',
    LIVRAISONS_PRINT: 'livraisons.print',

    // Permissions camions
    CAMIONS_CREATE: 'camions.create',
    CAMIONS_READ: 'camions.read',
    CAMIONS_UPDATE: 'camions.update',
    CAMIONS_DELETE: 'camions.delete',
    CAMIONS_ASSIGN: 'camions.assign',

    // Permissions rapports
    RAPPORTS_STOCK: 'rapports.stock',
    RAPPORTS_FINANCIAL: 'rapports.financial',
    RAPPORTS_OPERATIONAL: 'rapports.operational',
    RAPPORTS_LIVRAISONS: 'rapports.livraisons',
    RAPPORTS_ALL: 'rapports.all',
    RAPPORTS_EXPORT: 'rapports.export',

    // Permissions système
    SETTINGS_MANAGE: 'settings.manage',
    SETTINGS_BACKUP: 'settings.backup',
    SYSTEM_LOGS: 'system.logs',
    SYSTEM_MAINTENANCE: 'system.maintenance',

    // Permissions dashboard
    DASHBOARD_VIEW: 'dashboard.view',
    DASHBOARD_STATS: 'dashboard.stats',
    DASHBOARD_ALERTS: 'dashboard.alerts',
    
    // Permissions traçabilité
    TRACEABILITY_VIEW: 'traceability.view',
    TRACEABILITY_EXPORT: 'traceability.export'
};

// Permissions par rôle
export const ROLE_PERMISSIONS = {
    [USER_ROLES.MANAGER]: [
        // Le manager a TOUTES les permissions (admin + manager)
        ...Object.values(PERMISSIONS)
    ],
    [USER_ROLES.OPERATOR]: [
        // Stock - gestion complète pour son magasin
        PERMISSIONS.STOCK_CREATE,
        PERMISSIONS.STOCK_READ,
        PERMISSIONS.STOCK_UPDATE,
        PERMISSIONS.STOCK_ADJUST,
        PERMISSIONS.STOCK_EXPORT,
        
        // Produits - lecture et gestion
        PERMISSIONS.PRODUITS_CREATE,
        PERMISSIONS.PRODUITS_READ,
        PERMISSIONS.PRODUITS_UPDATE,
        
        // Clients - gestion complète
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CLIENTS_READ,
        PERMISSIONS.CLIENTS_UPDATE,
        PERMISSIONS.CLIENTS_EXPORT,
        
        // Commandes - gestion complète
        PERMISSIONS.COMMANDES_CREATE,
        PERMISSIONS.COMMANDES_READ,
        PERMISSIONS.COMMANDES_UPDATE,
        PERMISSIONS.COMMANDES_VALIDATE,
        PERMISSIONS.COMMANDES_CANCEL,
        PERMISSIONS.COMMANDES_EXPORT,
        PERMISSIONS.COMMANDES_VIEW_PRICES,
        
        // Livraisons - gestion complète
        PERMISSIONS.LIVRAISONS_CREATE,
        PERMISSIONS.LIVRAISONS_READ,
        PERMISSIONS.LIVRAISONS_UPDATE,
        PERMISSIONS.LIVRAISONS_MANAGE,
        PERMISSIONS.LIVRAISONS_TRACK,
        PERMISSIONS.LIVRAISONS_PRINT,
        
        // Rapports de son magasin
        PERMISSIONS.RAPPORTS_STOCK,
        PERMISSIONS.RAPPORTS_OPERATIONAL,
        PERMISSIONS.RAPPORTS_EXPORT,
        
        // Dashboard
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_STATS
    ]
};

// Types de mouvements de stock
export const STOCK_MOVEMENT_TYPES = {
    ENTREE: 'entree',
    SORTIE: 'sortie',
    TRANSFERT: 'transfert',
    AJUSTEMENT: 'ajustement',
    PERTE: 'perte',
    RETOUR: 'retour',
    DISPATCH: 'dispatch'
};

export const MOVEMENT_TYPE_LABELS = {
    [STOCK_MOVEMENT_TYPES.ENTREE]: 'Entrée',
    [STOCK_MOVEMENT_TYPES.SORTIE]: 'Sortie',
    [STOCK_MOVEMENT_TYPES.TRANSFERT]: 'Transfert',
    [STOCK_MOVEMENT_TYPES.AJUSTEMENT]: 'Ajustement',
    [STOCK_MOVEMENT_TYPES.PERTE]: 'Perte',
    [STOCK_MOVEMENT_TYPES.RETOUR]: 'Retour',
    [STOCK_MOVEMENT_TYPES.DISPATCH]: 'Dispatching'
};

// Statuts des commandes
export const ORDER_STATUS = {
    BROUILLON: 'brouillon',
    CONFIRMEE: 'confirmee',
    EN_PREPARATION: 'en_preparation',
    PRETE: 'prete',
    EN_LIVRAISON: 'en_livraison',
    LIVREE: 'livree',
    ANNULEE: 'annulee'
};

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.BROUILLON]: 'Brouillon',
    [ORDER_STATUS.CONFIRMEE]: 'Confirmée',
    [ORDER_STATUS.EN_PREPARATION]: 'En préparation',
    [ORDER_STATUS.PRETE]: 'Prête',
    [ORDER_STATUS.EN_LIVRAISON]: 'En livraison',
    [ORDER_STATUS.LIVREE]: 'Livrée',
    [ORDER_STATUS.ANNULEE]: 'Annulée'
};

export const ORDER_STATUS_COLORS = {
    [ORDER_STATUS.BROUILLON]: 'gray',
    [ORDER_STATUS.CONFIRMEE]: 'blue',
    [ORDER_STATUS.EN_PREPARATION]: 'yellow',
    [ORDER_STATUS.PRETE]: 'green',
    [ORDER_STATUS.EN_LIVRAISON]: 'purple',
    [ORDER_STATUS.LIVREE]: 'green',
    [ORDER_STATUS.ANNULEE]: 'red'
};

// Statuts des livraisons
export const DELIVERY_STATUS = {
    PROGRAMMEE: 'programmee',
    EN_PREPARATION: 'en_preparation',
    EN_CHARGEMENT: 'en_chargement',
    EN_ROUTE: 'en_route',
    LIVREE_COMPLETE: 'livree_complete',
    LIVREE_PARTIELLE: 'livree_partielle',
    RETOURNEE: 'retournee',
    INCIDENT: 'incident',
    ANNULEE: 'annulee'
};

export const DELIVERY_STATUS_LABELS = {
    [DELIVERY_STATUS.PROGRAMMEE]: 'Programmée',
    [DELIVERY_STATUS.EN_PREPARATION]: 'En préparation',
    [DELIVERY_STATUS.EN_CHARGEMENT]: 'En chargement',
    [DELIVERY_STATUS.EN_ROUTE]: 'En route',
    [DELIVERY_STATUS.LIVREE_COMPLETE]: 'Livrée complète',
    [DELIVERY_STATUS.LIVREE_PARTIELLE]: 'Livrée partielle',
    [DELIVERY_STATUS.RETOURNEE]: 'Retournée',
    [DELIVERY_STATUS.INCIDENT]: 'Incident',
    [DELIVERY_STATUS.ANNULEE]: 'Annulée'
};

export const DELIVERY_STATUS_COLORS = {
    [DELIVERY_STATUS.PROGRAMMEE]: 'blue',
    [DELIVERY_STATUS.EN_PREPARATION]: 'yellow',
    [DELIVERY_STATUS.EN_CHARGEMENT]: 'orange',
    [DELIVERY_STATUS.EN_ROUTE]: 'purple',
    [DELIVERY_STATUS.LIVREE_COMPLETE]: 'green',
    [DELIVERY_STATUS.LIVREE_PARTIELLE]: 'cyan',
    [DELIVERY_STATUS.RETOURNEE]: 'gray',
    [DELIVERY_STATUS.INCIDENT]: 'red',
    [DELIVERY_STATUS.ANNULEE]: 'red'
};

// Types de camions
export const TRUCK_TYPES = {
    PETIT: 'petit',
    MOYEN: 'moyen',
    GRAND: 'grand',
    CONTENEUR: 'conteneur'
};

export const TRUCK_TYPE_LABELS = {
    [TRUCK_TYPES.PETIT]: 'Petit camion (≤ 50T)',
    [TRUCK_TYPES.MOYEN]: 'Camion moyen (≤ 150T)',
    [TRUCK_TYPES.GRAND]: 'Grand camion (≤ 300T)',
    [TRUCK_TYPES.CONTENEUR]: 'Porte-conteneur (≤ 500T)'
};

export const TRUCK_CAPACITIES = {
    [TRUCK_TYPES.PETIT]: 50,
    [TRUCK_TYPES.MOYEN]: 150,
    [TRUCK_TYPES.GRAND]: 300,
    [TRUCK_TYPES.CONTENEUR]: 500
};

// Unités de mesure
export const UNITS = {
    TONNES: 'tonnes',
    KG: 'kg',
    SACS: 'sacs',
    CONTENEURS: 'conteneurs',
    LITRES: 'litres'
};

export const UNIT_LABELS = {
    [UNITS.TONNES]: 'Tonnes',
    [UNITS.KG]: 'Kilogrammes',
    [UNITS.SACS]: 'Sacs',
    [UNITS.CONTENEURS]: 'Conteneurs',
    [UNITS.LITRES]: 'Litres'
};

// Niveaux d'alerte stock
export const STOCK_ALERT_LEVELS = {
    OK: 'ok',
    FAIBLE: 'faible',
    CRITIQUE: 'critique',
    VIDE: 'vide'
};

export const STOCK_ALERT_COLORS = {
    [STOCK_ALERT_LEVELS.OK]: 'green',
    [STOCK_ALERT_LEVELS.FAIBLE]: 'yellow',
    [STOCK_ALERT_LEVELS.CRITIQUE]: 'red',
    [STOCK_ALERT_LEVELS.VIDE]: 'gray'
};

// Types de clients
export const CLIENT_TYPES = {
    ENTREPRISE: 'entreprise',
    PARTICULIER: 'particulier',
    GOUVERNEMENT: 'gouvernement'
};

export const CLIENT_TYPE_LABELS = {
    [CLIENT_TYPES.ENTREPRISE]: 'Entreprise',
    [CLIENT_TYPES.PARTICULIER]: 'Particulier',
    [CLIENT_TYPES.GOUVERNEMENT]: 'Gouvernement'
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100
};

// Formats de date
export const DATE_FORMATS = {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
    INPUT: 'yyyy-MM-dd',
    API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'
};

// Regex patterns
export const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_SENEGAL: /^(\+221|221)?[0-9]{9}$/,
    CODE_PRODUIT: /^[A-Z]{2,4}-[0-9]{3,6}$/,
    CODE_CLIENT: /^CL-[0-9]{4,6}$/,
    NUMERO_COMMANDE: /^CMD-[0-9]{6}$/,
    NUMERO_LIVRAISON: /^LIV-[0-9]{6}$/
};

// Messages par défaut
export const MESSAGES = {
    LOADING: 'Chargement en cours...',
    NO_DATA: 'Aucune donnée disponible',
    ERROR_GENERIC: 'Une erreur est survenue',
    ERROR_NETWORK: 'Erreur de connexion réseau',
    ERROR_UNAUTHORIZED: 'Accès non autorisé',
    SUCCESS_SAVE: 'Données sauvegardées avec succès',
    SUCCESS_DELETE: 'Élément supprimé avec succès',
    CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?'
};

// Navigation
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    STOCK: '/stock',
    PRODUCTS: '/produits',
    CLIENTS: '/clients',
    ORDERS: '/commandes',
    DELIVERIES: '/livraisons',
    MOVEMENTS: '/mouvements',
    REPORTS: '/rapports',
    USERS: '/users',
    WAREHOUSES: '/magasins',
    PROFILE: '/profile',
    SETTINGS: '/settings'
};

// Couleurs des graphiques
export const CHART_COLORS = {
    PRIMARY: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    STOCK: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
    MOVEMENTS: ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
};

// Configuration des exports
export const EXPORT_FORMATS = {
    EXCEL: 'excel',
    PDF: 'pdf',
    CSV: 'csv'
};

// Tailles des fichiers
export const FILE_SIZES = {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Configuration ITS Sénégal
export const COMPANY_INFO = {
    NAME: 'International Trading and Shipping',
    SHORT_NAME: 'ITS Sénégal',
    ADDRESS: 'Dakar, Sénégal',
    PHONE: '+221 33 XXX XX XX',
    EMAIL: 'contact@its-senegal.com',
    WEBSITE: 'www.its-senegal.com'
};

// Devises
export const CURRENCIES = {
    XOF: 'XOF', // Franc CFA
    EUR: 'EUR',
    USD: 'USD'
};

export const CURRENCY_SYMBOLS = {
    [CURRENCIES.XOF]: 'FCFA',
    [CURRENCIES.EUR]: '€',
    [CURRENCIES.USD]: '$'
};

// Configuration locale
export const LOCALE = {
    LANGUAGE: 'fr',
    COUNTRY: 'SN',
    TIMEZONE: 'Africa/Dakar',
    CURRENCY: CURRENCIES.XOF
};

// Alias pour compatibilité avec mockApi.js (important: no 'export const' again for PERMISSIONS here)
export const ROLES = USER_ROLES;
export const TRANSACTION_TYPES = STOCK_MOVEMENT_TYPES;
export const COMMANDE_STATUTS = ORDER_STATUS;
export const LIVRAISON_STATUTS = DELIVERY_STATUS;

// Catégories de produits - International Trading and Shipping
export const PRODUIT_CATEGORIES = {
    CEREALES: 'cereales',
    LEGUMINEUSES: 'legumineuses',
    OLEAGINEUX: 'oleagineux',
    ALIMENTS_BETAIL: 'aliments_betail',
    ENGRAIS: 'engrais',
    PRODUITS_TRANSFORMES: 'produits_transformes',
    CONTENEURS: 'conteneurs',
    AUTRE: 'autre'
};

export const PRODUIT_CATEGORIES_LABELS = {
    [PRODUIT_CATEGORIES.CEREALES]: 'Céréales (Maïs, Blé, Riz, Mil, Sorgho)',
    [PRODUIT_CATEGORIES.LEGUMINEUSES]: 'Légumineuses (Soja, Arachide, Niébé)',
    [PRODUIT_CATEGORIES.OLEAGINEUX]: 'Oléagineux (Tournesol, Colza, Sésame)',
    [PRODUIT_CATEGORIES.ALIMENTS_BETAIL]: 'Aliments pour Bétail',
    [PRODUIT_CATEGORIES.ENGRAIS]: 'Engrais et Intrants Agricoles',
    [PRODUIT_CATEGORIES.PRODUITS_TRANSFORMES]: 'Produits Transformés (Farine, Huile)',
    [PRODUIT_CATEGORIES.CONTENEURS]: 'Conteneurs et Matériel Maritime',
    [PRODUIT_CATEGORIES.AUTRE]: 'Autres Produits'
};

// Les magasins seront chargés depuis l'API
// Plus de données statiques ici