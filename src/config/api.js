// Configuration de l'API
export const API_CONFIG = {
  // URL de base de votre API backend
  // En développement, utilisez votre URL locale
  // En production, remplacez par l'URL de votre serveur
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  
  // Timeout pour les requêtes (en millisecondes)
  TIMEOUT: 30000,
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Endpoints de l'API
export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Stock
  STOCK: {
    LIST: '/api/stock',
    CREATE: '/api/stock',
    UPDATE: (id) => `/api/stock/${id}`,
    DELETE: (id) => `/api/stock/${id}`,
    STATS: '/api/stock/stats',
    MOUVEMENTS: '/api/stock/mouvements',
    ENTREE: '/api/stock/entree',
    SORTIE: '/api/stock/sortie',
    RECEPTION_NAVIRE: '/api/stock/reception-navire',
    ALERTES: '/api/stock/alertes',
    BY_MAGASIN: (magasinId) => `/api/stock/magasin/${magasinId}`,
    ALL: '/api/stock/all',
  },
  
  // Produits
  PRODUITS: {
    LIST: '/produits',
    CREATE: '/produits',
    UPDATE: (id) => `/produits/${id}`,
    DELETE: (id) => `/produits/${id}`,
    BY_ID: (id) => `/produits/${id}`,
  },
  
  // Magasins
  MAGASINS: {
    LIST: '/magasins',
    CREATE: '/magasins',
    UPDATE: (id) => `/magasins/${id}`,
    DELETE: (id) => `/magasins/${id}`,
    BY_ID: (id) => `/magasins/${id}`,
    STATS: (id) => `/magasins/${id}/stats`,
  },
  
  // Clients
  CLIENTS: {
    LIST: '/clients',
    CREATE: '/clients',
    UPDATE: (id) => `/clients/${id}`,
    DELETE: (id) => `/clients/${id}`,
    BY_ID: (id) => `/clients/${id}`,
  },
  
  // Utilisateurs
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    BY_ID: (id) => `/users/${id}`,
  },
  
  // Dashboard
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITIES: '/api/dashboard/activities',
    TOTAL_RECEPTIONNE: '/api/dashboard/total-receptionne',
    MAGASINIER: '/api/dashboard/magasinier',
  },
  
  // Navires et Dispatching
  NAVIRES: {
    LIST: '/api/navires',
    CREATE: '/api/navires',
    RECEPTION: '/api/navires/reception',
    DISPATCH: (id) => `/api/navires/${id}/dispatch`,
    DISPATCHES_EN_ATTENTE: '/api/navires/dispatches/en-attente',
    DISPATCHES_RECENTS: '/api/navires/dispatches/recents',
    ROTATIONS_EN_TRANSIT: '/api/navires/rotations/en-transit',
    CONFIRM_DISPATCH: (id) => `/api/navires/dispatches/${id}/confirm`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
  
  // Stock Magasinier
  STOCK_MAGASINIER: {
    JOUR: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/jour`,
    INITIALISER: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/initialiser`,
    ENTREE: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/entree`,
    SORTIE: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/sortie`,
    RESUME: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/resume`,
    HISTORIQUE: (magasinId) => `/api/stock-magasinier/magasin/${magasinId}/historique`,
  }
};