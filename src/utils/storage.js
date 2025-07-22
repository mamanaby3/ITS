// src/utils/storage.js

/**
 * Gestion du localStorage avec sérialisation/désérialisation automatique
 */
class StorageService {
    constructor(prefix = 'its_') {
        this.prefix = prefix;
    }

    /**
     * Obtenir une clé avec le préfixe
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Sauvegarder une valeur
     */
    set(key, value, options = {}) {
        try {
            const prefixedKey = this.getKey(key);
            const serializedValue = JSON.stringify({
                value,
                timestamp: new Date().getTime(),
                ...options
            });

            localStorage.setItem(prefixedKey, serializedValue);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
            return false;
        }
    }

    /**
     * Récupérer une valeur
     */
    get(key, defaultValue = null) {
        try {
            const prefixedKey = this.getKey(key);
            const item = localStorage.getItem(prefixedKey);

            if (!item) {
                return defaultValue;
            }

            const parsed = JSON.parse(item);

            // Vérifier l'expiration si définie
            if (parsed.expiresAt && new Date().getTime() > parsed.expiresAt) {
                this.remove(key);
                return defaultValue;
            }

            return parsed.value;
        } catch (error) {
            console.error(`Erreur lors de la récupération de ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Supprimer une valeur
     */
    remove(key) {
        try {
            const prefixedKey = this.getKey(key);
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de ${key}:`, error);
            return false;
        }
    }

    /**
     * Vérifier si une clé existe
     */
    has(key) {
        const prefixedKey = this.getKey(key);
        return localStorage.getItem(prefixedKey) !== null;
    }

    /**
     * Effacer toutes les données avec le préfixe
     */
    clear() {
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Erreur lors du nettoyage du storage:', error);
            return false;
        }
    }

    /**
     * Obtenir toutes les clés avec le préfixe
     */
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Obtenir toutes les valeurs avec le préfixe
     */
    getAll() {
        const items = {};
        const keys = this.getAllKeys();

        keys.forEach(fullKey => {
            const key = fullKey.substring(this.prefix.length);
            items[key] = this.get(key);
        });

        return items;
    }

    /**
     * Sauvegarder avec expiration
     */
    setWithExpiry(key, value, expiryMinutes) {
        const expiresAt = new Date().getTime() + (expiryMinutes * 60 * 1000);
        return this.set(key, value, { expiresAt });
    }
}

// Instance par défaut
const storage = new StorageService();

// Export des fonctions utilitaires
export const getItem = (key, defaultValue) => storage.get(key, defaultValue);
export const setItem = (key, value) => storage.set(key, value);
export const removeItem = (key) => storage.remove(key);
export const hasItem = (key) => storage.has(key);
export const clearStorage = () => storage.clear();

export { StorageService };
export default storage;