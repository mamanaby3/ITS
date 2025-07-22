// src/utils/validators.js
import { PATTERNS, UNITS, CLIENT_TYPES, USER_ROLES } from './constants';

/**
 * Validation des emails
 */
export const validateEmail = (email) => {
    if (!email) {
        return { isValid: false, error: 'Email requis' };
    }
    
    if (!PATTERNS.EMAIL.test(email)) {
        return { isValid: false, error: 'Format email invalide' };
    }
    
    return { isValid: true };
};

/**
 * Validation des numéros de téléphone
 */
export const validatePhone = (phone) => {
    if (!phone) {
        return { isValid: false, error: 'Téléphone requis' };
    }
    
    const cleaned = phone.replace(/\s/g, '');
    if (!PATTERNS.PHONE_SENEGAL.test(cleaned)) {
        return { isValid: false, error: 'Format téléphone invalide (ex: 77 123 45 67)' };
    }
    
    return { isValid: true };
};

/**
 * Validation des mots de passe
 */
export const validatePassword = (password, options = {}) => {
    const {
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = false
    } = options;
    
    if (!password) {
        return { isValid: false, error: 'Mot de passe requis' };
    }
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Au moins ${minLength} caractères`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Au moins une majuscule');
    }
    
    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Au moins une minuscule');
    }
    
    if (requireNumbers && !/\d/.test(password)) {
        errors.push('Au moins un chiffre');
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Au moins un caractère spécial');
    }
    
    if (errors.length > 0) {
        return { isValid: false, error: errors.join(', ') };
    }
    
    return { isValid: true };
};

/**
 * Validation des codes produits
 */
export const validateProductCode = (code) => {
    if (!code) {
        return { isValid: false, error: 'Code produit requis' };
    }
    
    if (!PATTERNS.CODE_PRODUIT.test(code)) {
        return { isValid: false, error: 'Format invalide (ex: ALI-12345)' };
    }
    
    return { isValid: true };
};

/**
 * Validation des codes clients
 */
export const validateClientCode = (code) => {
    if (!code) {
        return { isValid: false, error: 'Code client requis' };
    }
    
    if (!PATTERNS.CODE_CLIENT.test(code)) {
        return { isValid: false, error: 'Format invalide (ex: CL-1234)' };
    }
    
    return { isValid: true };
};

/**
 * Validation des numéros de commande
 */
export const validateOrderNumber = (number) => {
    if (!number) {
        return { isValid: false, error: 'Numéro de commande requis' };
    }
    
    if (!PATTERNS.NUMERO_COMMANDE.test(number)) {
        return { isValid: false, error: 'Format invalide (ex: CMD-123456)' };
    }
    
    return { isValid: true };
};

/**
 * Validation des quantités
 */
export const validateQuantity = (quantity, options = {}) => {
    const {
        min = 0,
        max = null,
        allowDecimals = false,
        unit = null
    } = options;
    
    if (quantity === null || quantity === undefined || quantity === '') {
        return { isValid: false, error: 'Quantité requise' };
    }
    
    const numValue = parseFloat(quantity);
    
    if (isNaN(numValue)) {
        return { isValid: false, error: 'Valeur numérique invalide' };
    }
    
    if (!allowDecimals && !Number.isInteger(numValue)) {
        return { isValid: false, error: 'Les décimales ne sont pas autorisées' };
    }
    
    if (numValue < min) {
        return { isValid: false, error: `Minimum ${min} ${unit || ''}` };
    }
    
    if (max !== null && numValue > max) {
        return { isValid: false, error: `Maximum ${max} ${unit || ''}` };
    }
    
    return { isValid: true, value: numValue };
};

/**
 * Validation des prix
 */
export const validatePrice = (price, options = {}) => {
    const {
        min = 0,
        max = null,
        currency = 'XOF'
    } = options;
    
    if (price === null || price === undefined || price === '') {
        return { isValid: false, error: 'Prix requis' };
    }
    
    const numValue = parseFloat(price);
    
    if (isNaN(numValue)) {
        return { isValid: false, error: 'Valeur numérique invalide' };
    }
    
    if (numValue < min) {
        return { isValid: false, error: `Prix minimum ${min} ${currency}` };
    }
    
    if (max !== null && numValue > max) {
        return { isValid: false, error: `Prix maximum ${max} ${currency}` };
    }
    
    // Pour le XOF, vérifier que c'est un nombre entier
    if (currency === 'XOF' && !Number.isInteger(numValue)) {
        return { isValid: false, error: 'Le prix doit être un nombre entier pour le FCFA' };
    }
    
    return { isValid: true, value: numValue };
};

/**
 * Validation des dates
 */
export const validateDate = (date, options = {}) => {
    const {
        min = null,
        max = null,
        allowPast = true,
        allowFuture = true
    } = options;
    
    if (!date) {
        return { isValid: false, error: 'Date requise' };
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return { isValid: false, error: 'Date invalide' };
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (!allowPast && dateObj < now) {
        return { isValid: false, error: 'Les dates passées ne sont pas autorisées' };
    }
    
    if (!allowFuture && dateObj > now) {
        return { isValid: false, error: 'Les dates futures ne sont pas autorisées' };
    }
    
    if (min && dateObj < new Date(min)) {
        return { isValid: false, error: `Date minimum: ${new Date(min).toLocaleDateString('fr-FR')}` };
    }
    
    if (max && dateObj > new Date(max)) {
        return { isValid: false, error: `Date maximum: ${new Date(max).toLocaleDateString('fr-FR')}` };
    }
    
    return { isValid: true, value: dateObj };
};

/**
 * Validation des plages de dates
 */
export const validateDateRange = (startDate, endDate) => {
    const startValidation = validateDate(startDate);
    if (!startValidation.isValid) {
        return { isValid: false, error: `Date début: ${startValidation.error}` };
    }
    
    const endValidation = validateDate(endDate);
    if (!endValidation.isValid) {
        return { isValid: false, error: `Date fin: ${endValidation.error}` };
    }
    
    if (startValidation.value > endValidation.value) {
        return { isValid: false, error: 'La date de début doit être antérieure à la date de fin' };
    }
    
    return { isValid: true };
};

/**
 * Validation des textes
 */
export const validateText = (text, options = {}) => {
    const {
        required = true,
        minLength = null,
        maxLength = null,
        pattern = null,
        patternMessage = 'Format invalide'
    } = options;
    
    if (required && (!text || text.trim() === '')) {
        return { isValid: false, error: 'Champ requis' };
    }
    
    if (!required && !text) {
        return { isValid: true };
    }
    
    const trimmed = text.trim();
    
    if (minLength !== null && trimmed.length < minLength) {
        return { isValid: false, error: `Minimum ${minLength} caractères` };
    }
    
    if (maxLength !== null && trimmed.length > maxLength) {
        return { isValid: false, error: `Maximum ${maxLength} caractères` };
    }
    
    if (pattern && !pattern.test(trimmed)) {
        return { isValid: false, error: patternMessage };
    }
    
    return { isValid: true, value: trimmed };
};

/**
 * Validation des sélections
 */
export const validateSelection = (value, options = {}) => {
    const {
        required = true,
        allowedValues = [],
        allowMultiple = false
    } = options;
    
    if (required && !value) {
        return { isValid: false, error: 'Sélection requise' };
    }
    
    if (!required && !value) {
        return { isValid: true };
    }
    
    if (allowMultiple) {
        if (!Array.isArray(value)) {
            return { isValid: false, error: 'Valeur multiple attendue' };
        }
        
        const invalidValues = value.filter(v => !allowedValues.includes(v));
        if (invalidValues.length > 0) {
            return { isValid: false, error: `Valeurs invalides: ${invalidValues.join(', ')}` };
        }
    } else {
        if (!allowedValues.includes(value)) {
            return { isValid: false, error: 'Valeur non autorisée' };
        }
    }
    
    return { isValid: true };
};

/**
 * Validation des formulaires de produit
 */
export const validateProductForm = (data) => {
    const errors = {};
    
    // Nom
    const nomValidation = validateText(data.nom, { minLength: 2, maxLength: 100 });
    if (!nomValidation.isValid) errors.nom = nomValidation.error;
    
    // Référence
    const refValidation = validateProductCode(data.reference);
    if (!refValidation.isValid) errors.reference = refValidation.error;
    
    // Catégorie
    if (!data.categorie) errors.categorie = 'Catégorie requise';
    
    // Unité
    const uniteValidation = validateSelection(data.unite, { 
        allowedValues: Object.keys(UNITS) 
    });
    if (!uniteValidation.isValid) errors.unite = uniteValidation.error;
    
    // Prix unitaire
    const prixValidation = validatePrice(data.prixUnitaire);
    if (!prixValidation.isValid) errors.prixUnitaire = prixValidation.error;
    
    // Seuil d'alerte
    const seuilValidation = validateQuantity(data.seuilAlerte, { min: 0 });
    if (!seuilValidation.isValid) errors.seuilAlerte = seuilValidation.error;
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validation des formulaires de client
 */
export const validateClientForm = (data) => {
    const errors = {};
    
    // Nom
    const nomValidation = validateText(data.nom, { minLength: 2, maxLength: 100 });
    if (!nomValidation.isValid) errors.nom = nomValidation.error;
    
    // Email
    if (data.email) {
        const emailValidation = validateEmail(data.email);
        if (!emailValidation.isValid) errors.email = emailValidation.error;
    }
    
    // Téléphone
    const phoneValidation = validatePhone(data.telephone);
    if (!phoneValidation.isValid) errors.telephone = phoneValidation.error;
    
    // Type
    const typeValidation = validateSelection(data.type, {
        allowedValues: Object.keys(CLIENT_TYPES)
    });
    if (!typeValidation.isValid) errors.type = typeValidation.error;
    
    // Limite de crédit
    if (data.creditLimit !== undefined) {
        const creditValidation = validatePrice(data.creditLimit, { min: 0 });
        if (!creditValidation.isValid) errors.creditLimit = creditValidation.error;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validation des mouvements de stock
 */
export const validateStockMovement = (data) => {
    const errors = {};
    
    // Produit
    if (!data.produitId) errors.produitId = 'Produit requis';
    
    // Quantité
    const qteValidation = validateQuantity(data.quantite, { min: 1 });
    if (!qteValidation.isValid) errors.quantite = qteValidation.error;
    
    // Type de mouvement
    if (!data.type) errors.type = 'Type de mouvement requis';
    
    // Emplacement (pour les entrées)
    if (data.type === 'entree' && !data.emplacement) {
        errors.emplacement = 'Emplacement requis pour les entrées';
    }
    
    // Date d'expiration (optionnelle mais doit être future)
    if (data.dateExpiration) {
        const dateValidation = validateDate(data.dateExpiration, { allowPast: false });
        if (!dateValidation.isValid) errors.dateExpiration = dateValidation.error;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validation des commandes
 */
export const validateOrderForm = (data) => {
    const errors = {};
    
    // Client
    if (!data.clientId) errors.clientId = 'Client requis';
    
    // Articles
    if (!data.articles || data.articles.length === 0) {
        errors.articles = 'Au moins un article requis';
    } else {
        data.articles.forEach((article, index) => {
            if (!article.produitId) {
                errors[`article_${index}_produit`] = 'Produit requis';
            }
            
            const qteValidation = validateQuantity(article.quantite, { min: 1 });
            if (!qteValidation.isValid) {
                errors[`article_${index}_quantite`] = qteValidation.error;
            }
        });
    }
    
    // Date de livraison prévue
    if (data.dateLivraisonPrevue) {
        const dateValidation = validateDate(data.dateLivraisonPrevue, { allowPast: false });
        if (!dateValidation.isValid) errors.dateLivraisonPrevue = dateValidation.error;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validation des utilisateurs
 */
export const validateUserForm = (data, isNew = true) => {
    const errors = {};
    
    // Email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) errors.email = emailValidation.error;
    
    // Mot de passe (seulement pour les nouveaux utilisateurs)
    if (isNew || data.password) {
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.isValid) errors.password = passwordValidation.error;
    }
    
    // Nom et prénom
    const nomValidation = validateText(data.nom, { minLength: 2, maxLength: 50 });
    if (!nomValidation.isValid) errors.nom = nomValidation.error;
    
    const prenomValidation = validateText(data.prenom, { minLength: 2, maxLength: 50 });
    if (!prenomValidation.isValid) errors.prenom = prenomValidation.error;
    
    // Rôle
    const roleValidation = validateSelection(data.role, {
        allowedValues: Object.values(USER_ROLES)
    });
    if (!roleValidation.isValid) errors.role = roleValidation.error;
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Fonction de validation générique
 */
export const validate = (value, rules) => {
    const errors = [];
    
    for (const rule of rules) {
        const result = rule(value);
        if (!result.isValid) {
            errors.push(result.error);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Règles de validation prédéfinies
 */
export const rules = {
    required: (message = 'Champ requis') => (value) => ({
        isValid: value !== null && value !== undefined && value !== '',
        error: message
    }),
    
    min: (min, message) => (value) => ({
        isValid: parseFloat(value) >= min,
        error: message || `Minimum ${min}`
    }),
    
    max: (max, message) => (value) => ({
        isValid: parseFloat(value) <= max,
        error: message || `Maximum ${max}`
    }),
    
    minLength: (length, message) => (value) => ({
        isValid: value && value.length >= length,
        error: message || `Minimum ${length} caractères`
    }),
    
    maxLength: (length, message) => (value) => ({
        isValid: !value || value.length <= length,
        error: message || `Maximum ${length} caractères`
    }),
    
    pattern: (pattern, message) => (value) => ({
        isValid: !value || pattern.test(value),
        error: message || 'Format invalide'
    }),
    
    email: (message) => (value) => validateEmail(value),
    
    phone: (message) => (value) => validatePhone(value)
};

// Export par défaut
export default {
    validateEmail,
    validatePhone,
    validatePassword,
    validateProductCode,
    validateClientCode,
    validateOrderNumber,
    validateQuantity,
    validatePrice,
    validateDate,
    validateDateRange,
    validateText,
    validateSelection,
    validateProductForm,
    validateClientForm,
    validateStockMovement,
    validateOrderForm,
    validateUserForm,
    validate,
    rules
};