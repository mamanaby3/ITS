// src/utils/formatters.js
import { format, parseISO, isValid, formatDistance, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CURRENCY_SYMBOLS, LOCALE, DATE_FORMATS, UNIT_LABELS } from './constants';

/**
 * Formatage des nombres
 */
export const formatNumber = (number, decimals = 0) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
};

/**
 * Formatage des devises
 */
export const formatCurrency = (amount, currency = LOCALE.CURRENCY, showSymbol = true) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return showSymbol ? `0 ${CURRENCY_SYMBOLS[currency]}` : '0';
    }
    
    const formatted = formatNumber(amount, currency === 'XOF' ? 0 : 2);
    return showSymbol ? `${formatted} ${CURRENCY_SYMBOLS[currency]}` : formatted;
};

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

export const formatDateRelative = (date) => {
    if (!date) return '';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatDistance(dateObj, new Date(), { 
            addSuffix: true, 
            locale: fr 
        });
    } catch (error) {
        return formatDate(date);
    }
};

export const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    return `Du ${start} au ${end}`;
};

/**
 * Formatage des pourcentages
 */
export const formatPercentage = (value, decimals = 1, showSign = false) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    const formatted = formatNumber(value, decimals);
    const sign = showSign && value > 0 ? '+' : '';
    
    return `${sign}${formatted}%`;
};

/**
 * Formatage des poids et mesures
 */
export const formatWeight = (weight, unit = 'kg') => {
    if (weight === null || weight === undefined || isNaN(weight)) return `0 ${unit}`;
    
    let convertedWeight = weight;
    let displayUnit = unit;
    
    // Conversion automatique pour une meilleure lisibilit�
    if (unit === 'kg' && weight >= 1000) {
        convertedWeight = weight / 1000;
        displayUnit = 'tonnes';
    } else if (unit === 'g' && weight >= 1000) {
        convertedWeight = weight / 1000;
        displayUnit = 'kg';
    }
    
    const decimals = displayUnit === 'tonnes' ? 2 : 0;
    const formatted = formatNumber(convertedWeight, decimals);
    
    return `${formatted} ${UNIT_LABELS[displayUnit] || displayUnit}`;
};

export const formatVolume = (volume, unit = 'litres') => {
    if (volume === null || volume === undefined || isNaN(volume)) return `0 ${unit}`;
    
    const formatted = formatNumber(volume, unit === 'litres' ? 0 : 2);
    return `${formatted} ${UNIT_LABELS[unit] || unit}`;
};

/**
 * Formatage des quantit�s
 */
export const formatQuantity = (quantity, unit = 'pcs') => {
    if (quantity === null || quantity === undefined || isNaN(quantity)) return '0';
    
    const formatted = formatNumber(quantity, 0);
    
    // Toujours afficher l'unité si elle est fournie
    if (unit && unit.trim() !== '' && unit !== 'undefined' && unit !== 'null') {
        const displayUnit = UNIT_LABELS[unit] || unit;
        return `${formatted} ${displayUnit}`;
    }
    
    return formatted;
};

/**
 * Formatage des codes et r�f�rences
 */
export const formatReference = (prefix, number, length = 6) => {
    if (!prefix || number === null || number === undefined) return '';
    
    const paddedNumber = number.toString().padStart(length, '0');
    return `${prefix}-${paddedNumber}`;
};

export const formatCode = (code) => {
    if (!code) return '';
    return code.toUpperCase().replace(/\s+/g, '-');
};

/**
 * Formatage des noms et textes
 */
export const formatName = (firstName, lastName) => {
    const parts = [];
    if (firstName) parts.push(firstName);
    if (lastName) parts.push(lastName.toUpperCase());
    
    return parts.join(' ') || '';
};

export const formatInitials = (firstName, lastName) => {
    const initials = [];
    if (firstName) initials.push(firstName.charAt(0).toUpperCase());
    if (lastName) initials.push(lastName.charAt(0).toUpperCase());
    
    return initials.join('') || '?';
};

export const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Nettoyer le num�ro
    const cleaned = phone.replace(/\D/g, '');
    
    // Format s�n�galais
    if (cleaned.startsWith('221')) {
        const number = cleaned.substring(3);
        return `+221 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`;
    }
    
    // Format local
    if (cleaned.length === 9) {
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
    }
    
    return phone;
};

export const formatAddress = (address, city, country = 'S�n�gal') => {
    const parts = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    if (country) parts.push(country);
    
    return parts.join(', ') || '';
};

/**
 * Formatage des statuts
 */
export const formatStatus = (status, labels = {}) => {
    if (!status) return '';
    
    return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Formatage des dur�es
 */
export const formatDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    
    return `${hours}h ${mins}min`;
};

export const formatDays = (days) => {
    if (!days || days < 0) return '0 jour';
    
    if (days === 1) return '1 jour';
    return `${days} jours`;
};

/**
 * Formatage des tailles de fichiers
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formatage des tableaux et listes
 */
export const formatList = (items, separator = ', ', lastSeparator = ' et ') => {
    if (!Array.isArray(items) || items.length === 0) return '';
    if (items.length === 1) return items[0];
    
    const allButLast = items.slice(0, -1).join(separator);
    return allButLast + lastSeparator + items[items.length - 1];
};

/**
 * Formatage des plages de valeurs
 */
export const formatRange = (min, max, unit = '') => {
    if (min === max) return `${min}${unit}`;
    return `${min} - ${max}${unit}`;
};

/**
 * Formatage des variations
 */
export const formatVariation = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, formatted: '0%', trend: 'stable' };
    
    const variation = ((current - previous) / previous) * 100;
    const trend = variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable';
    
    return {
        value: variation,
        formatted: formatPercentage(Math.abs(variation), 1, true),
        trend
    };
};

/**
 * Formatage pour l'export CSV
 */
export const formatForCSV = (value) => {
    if (value === null || value === undefined) return '';
    
    const stringValue = value.toString();
    // �chapper les guillemets et encapsuler si n�cessaire
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
};

/**
 * Formatage g�n�rique avec fallback
 */
export const formatValue = (value, type = 'text', options = {}) => {
    if (value === null || value === undefined) return options.defaultValue || '-';
    
    switch (type) {
        case 'currency':
            return formatCurrency(value, options.currency);
        case 'number':
            return formatNumber(value, options.decimals);
        case 'percentage':
            return formatPercentage(value, options.decimals);
        case 'date':
            return formatDate(value, options.format);
        case 'datetime':
            return formatDateTime(value);
        case 'weight':
            return formatWeight(value, options.unit);
        case 'quantity':
            return formatQuantity(value, options.unit);
        case 'phone':
            return formatPhone(value);
        case 'status':
            return formatStatus(value, options.labels);
        default:
            return value.toString();
    }
};

/**
 * Utilitaires de calcul
 */
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
};

export const calculateVariation = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const calculateAverage = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    return sum / values.length;
};

// Export par d�faut d'un objet avec toutes les fonctions
export default {
    formatNumber,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatDateRelative,
    formatDateRange,
    formatPercentage,
    formatWeight,
    formatVolume,
    formatQuantity,
    formatReference,
    formatCode,
    formatName,
    formatInitials,
    formatPhone,
    formatAddress,
    formatStatus,
    formatDuration,
    formatDays,
    formatFileSize,
    formatList,
    formatRange,
    formatVariation,
    formatForCSV,
    formatValue,
    calculatePercentage,
    calculateVariation,
    calculateAverage
};