import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    DATE_FORMATS,
    CURRENCY_SYMBOLS,
    LOCALE,
    STOCK_ALERT_LEVELS,
    ORDER_STATUS_COLORS,
    PATTERNS
} from './constants.js';

/**
 * Formatage des dates
 */
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) return '';

        return format(dateObj, formatString, { locale: fr });
    } catch (error) {
        console.error('Erreur formatage date:', error);
        return '';
    }
};

export const formatDateTime = (date) => {
    return formatDate(date, DATE_FORMATS.DISPLAY_TIME);
};

export const formatDateInput = (date) => {
    return formatDate(date, DATE_FORMATS.INPUT);
};

export const getRelativeDate = (date) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const days = differenceInDays(new Date(), dateObj);

        if (days === 0) return "Aujourd'hui";
        if (days === 1) return 'Hier';
        if (days === -1) return 'Demain';
        if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        return `Dans ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
    } catch (error) {
        return formatDate(date);
    }
};

/**
 * Formatage des nombres et monnaies
 */
export const formatNumber = (number, decimals = 0) => {
    if (number === null || number === undefined || isNaN(number)) return '0';

    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
};

export const formatCurrency = (amount, currency = LOCALE.CURRENCY) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 ' + CURRENCY_SYMBOLS[currency];

    const formatted = formatNumber(amount, 0);
    return `${formatted} ${CURRENCY_SYMBOLS[currency]}`;
};

export const formatWeight = (weight, unit = 'tonnes') => {
    if (weight === null || weight === undefined || isNaN(weight)) return '0';

    const formatted = formatNumber(weight, unit === 'tonnes' ? 1 : 0);
    return `${formatted} ${unit}`;
};

export const formatPercentage = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';

    return `${formatNumber(value, decimals)}%`;
};

/**
 * Gestion des chaînes de caractères
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, length = 50) => {
    if (!str || str.length <= length) return str || '';
    return str.substring(0, length) + '...';
};

export const slugify = (str) => {
    if (!str) return '';

    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
        .replace(/\s+/g, '-') // Remplacer espaces par tirets
        .replace(/-+/g, '-') // Supprimer tirets multiples
        .trim('-'); // Supprimer tirets en début/fin
};

export const generateCode = (prefix, number, length = 6) => {
    const paddedNumber = number.toString().padStart(length, '0');
    return `${prefix}-${paddedNumber}`;
};

/**
 * Validation
 */
export const isValidEmail = (email) => {
    return PATTERNS.EMAIL.test(email);
};

export const isValidPhone = (phone) => {
    return PATTERNS.PHONE_SENEGAL.test(phone);
};

export const isValidNumber = (value) => {
    return !isNaN(value) && isFinite(value);
};

export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Gestion des alertes de stock
 */
export const getStockAlertLevel = (currentStock, alertThreshold, criticalThreshold) => {
    if (currentStock <= 0) return STOCK_ALERT_LEVELS.VIDE;
    if (currentStock <= criticalThreshold) return STOCK_ALERT_LEVELS.CRITIQUE;
    if (currentStock <= alertThreshold) return STOCK_ALERT_LEVELS.FAIBLE;
    return STOCK_ALERT_LEVELS.OK;
};

export const getStockAlertColor = (level) => {
    const colors = {
        [STOCK_ALERT_LEVELS.OK]: 'text-green-600 bg-green-100',
        [STOCK_ALERT_LEVELS.FAIBLE]: 'text-yellow-600 bg-yellow-100',
        [STOCK_ALERT_LEVELS.CRITIQUE]: 'text-red-600 bg-red-100',
        [STOCK_ALERT_LEVELS.VIDE]: 'text-gray-600 bg-gray-100'
    };
    return colors[level] || colors[STOCK_ALERT_LEVELS.OK];
};

/**
 * Gestion des statuts
 */
export const getStatusColor = (status, type = 'order') => {
    if (type === 'order') {
        return ORDER_STATUS_COLORS[status] || 'gray';
    }
    return 'gray';
};

export const getStatusBadgeClass = (status, type = 'order') => {
    const color = getStatusColor(status, type);
    const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const colorClasses = {
        gray: 'bg-gray-100 text-gray-800',
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        red: 'bg-red-100 text-red-800',
        purple: 'bg-purple-100 text-purple-800'
    };

    return `${baseClass} ${colorClasses[color] || colorClasses.gray}`;
};

/**
 * Manipulation d'objets et tableaux
 */
export const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

export const filterBy = (array, filters) => {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === '' || value === null || value === undefined) return true;

            const itemValue = item[key];
            if (typeof value === 'string') {
                return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
            }
            return itemValue === value;
        });
    });
};

export const paginate = (array, page = 1, pageSize = 20) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
        data: array.slice(start, end),
        pagination: {
            page,
            pageSize,
            total: array.length,
            totalPages: Math.ceil(array.length / pageSize),
            hasNext: end < array.length,
            hasPrev: page > 1
        }
    };
};

/**
 * Utilitaires de calcul
 */
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
};

export const calculateDifference = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const sum = (array, key) => {
    return array.reduce((total, item) => {
        const value = key ? item[key] : item;
        return total + (isValidNumber(value) ? parseFloat(value) : 0);
    }, 0);
};

export const average = (array, key) => {
    if (!array.length) return 0;
    return sum(array, key) / array.length;
};

/**
 * Gestion des fichiers
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

export const isImageFile = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(getFileExtension(filename));
};

/**
 * Gestion des URLs et navigation
 */
export const buildUrl = (base, params = {}) => {
    const url = new URL(base, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
};

export const parseUrlParams = (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const result = {};

    for (const [key, value] of params.entries()) {
        result[key] = value;
    }

    return result;
};

/**
 * Génération d'ID unique
 */
export const generateId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
};

/**
 * Utilitaires divers
 */
export const debounce = (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, wait) => {
    let inThrottle;

    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Erreur copie presse-papier:', error);
        return false;
    }
};

export const downloadFile = (data, filename, type = 'text/plain') => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(url);
};

/**
 * Validation spécifique ITS
 */
export const validateStockMovement = (movement) => {
    const errors = {};

    if (!movement.produit_id) errors.produit = 'Produit requis';
    if (!movement.quantite || movement.quantite <= 0) errors.quantite = 'Quantité doit être positive';
    if (!movement.type_mouvement) errors.type = 'Type de mouvement requis';
    if (!movement.magasin_id) errors.magasin = 'Magasin requis';

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateOrder = (order) => {
    const errors = {};

    if (!order.client_id) errors.client = 'Client requis';
    if (!order.magasin_id) errors.magasin = 'Magasin requis';
    if (!order.lignes || order.lignes.length === 0) errors.lignes = 'Au moins une ligne de commande requise';

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};
