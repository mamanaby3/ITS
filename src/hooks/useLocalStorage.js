import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer le localStorage avec React
 * @param {string} key - La clé du localStorage
 * @param {any} defaultValue - La valeur par défaut si aucune valeur n'est trouvée
 * @param {Object} options - Options de configuration
 * @param {boolean} options.serialize - Si true, sérialise/désérialise automatiquement les objets (défaut: true)
 * @param {number} options.syncInterval - Intervalle en ms pour synchroniser avec d'autres onglets (défaut: null)
 * @returns {[any, Function, Function]} - [valeur, setValue, removeValue]
 */
export const useLocalStorage = (key, defaultValue, options = {}) => {
  const {
    serialize = true,
    syncInterval = null
  } = options;

  // Fonction pour lire depuis le localStorage
  const readFromStorage = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return defaultValue;
      }
      
      if (serialize) {
        return JSON.parse(item);
      }
      
      return item;
    } catch (error) {
      console.error(`Erreur lors de la lecture du localStorage pour la clé "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, serialize]);

  // État initial
  const [storedValue, setStoredValue] = useState(readFromStorage);

  // Fonction pour écrire dans le localStorage
  const setValue = useCallback((value) => {
    try {
      // Permettre les fonctions de mise à jour
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder dans l'état
      setStoredValue(valueToStore);
      
      // Sauvegarder dans le localStorage
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        const serializedValue = serialize ? JSON.stringify(valueToStore) : valueToStore;
        window.localStorage.setItem(key, serializedValue);
      }
      
      // Déclencher un événement personnalisé pour synchroniser avec d'autres onglets
      window.dispatchEvent(new CustomEvent('localStorage-update', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Erreur lors de l'écriture dans le localStorage pour la clé "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      window.localStorage.removeItem(key);
      
      // Déclencher un événement personnalisé
      window.dispatchEvent(new CustomEvent('localStorage-update', {
        detail: { key, value: null }
      }));
    } catch (error) {
      console.error(`Erreur lors de la suppression du localStorage pour la clé "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Écouter les changements du localStorage depuis d'autres onglets
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = serialize ? JSON.parse(e.newValue) : e.newValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Erreur lors de la synchronisation du localStorage:`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(defaultValue);
      }
    };

    // Écouter l'événement storage natif (changements depuis d'autres onglets)
    window.addEventListener('storage', handleStorageChange);

    // Écouter notre événement personnalisé (changements depuis le même onglet)
    const handleCustomStorageChange = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };
    window.addEventListener('localStorage-update', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage-update', handleCustomStorageChange);
    };
  }, [key, defaultValue, serialize]);

  // Synchronisation périodique si demandée
  useEffect(() => {
    if (syncInterval && syncInterval > 0) {
      const interval = setInterval(() => {
        const currentValue = readFromStorage();
        if (JSON.stringify(currentValue) !== JSON.stringify(storedValue)) {
          setStoredValue(currentValue);
        }
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [syncInterval, readFromStorage, storedValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook pour gérer un objet dans le localStorage avec des méthodes utilitaires
 */
export const useLocalStorageObject = (key, defaultValue = {}) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);

  // Mettre à jour une propriété spécifique
  const updateProperty = useCallback((propertyKey, propertyValue) => {
    setValue(prev => ({
      ...prev,
      [propertyKey]: propertyValue
    }));
  }, [setValue]);

  // Supprimer une propriété
  const removeProperty = useCallback((propertyKey) => {
    setValue(prev => {
      const newValue = { ...prev };
      delete newValue[propertyKey];
      return newValue;
    });
  }, [setValue]);

  // Fusionner avec un nouvel objet
  const merge = useCallback((newData) => {
    setValue(prev => ({
      ...prev,
      ...newData
    }));
  }, [setValue]);

  // Réinitialiser à la valeur par défaut
  const reset = useCallback(() => {
    setValue(defaultValue);
  }, [setValue, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    updateProperty,
    removeProperty,
    merge,
    reset
  };
};

/**
 * Hook pour gérer un tableau dans le localStorage avec des méthodes utilitaires
 */
export const useLocalStorageArray = (key, defaultValue = []) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);

  // Ajouter un élément
  const push = useCallback((item) => {
    setValue(prev => [...prev, item]);
  }, [setValue]);

  // Ajouter plusieurs éléments
  const pushMany = useCallback((items) => {
    setValue(prev => [...prev, ...items]);
  }, [setValue]);

  // Supprimer un élément par index
  const removeAt = useCallback((index) => {
    setValue(prev => prev.filter((_, i) => i !== index));
  }, [setValue]);

  // Supprimer un élément par prédicat
  const removeWhere = useCallback((predicate) => {
    setValue(prev => prev.filter(item => !predicate(item)));
  }, [setValue]);

  // Mettre à jour un élément par index
  const updateAt = useCallback((index, newItem) => {
    setValue(prev => prev.map((item, i) => i === index ? newItem : item));
  }, [setValue]);

  // Vider le tableau
  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  // Réinitialiser à la valeur par défaut
  const reset = useCallback(() => {
    setValue(defaultValue);
  }, [setValue, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    push,
    pushMany,
    removeAt,
    removeWhere,
    updateAt,
    clear,
    reset
  };
};

/**
 * Hook pour gérer les préférences utilisateur
 */
export const useUserPreferences = () => {
  const defaultPreferences = {
    theme: 'light',
    language: 'fr',
    itemsPerPage: 20,
    sidebarCollapsed: false,
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    dashboard: {
      widgets: ['stats', 'charts', 'recent-activity'],
      layout: 'grid'
    }
  };

  const {
    value: preferences,
    updateProperty,
    merge,
    reset
  } = useLocalStorageObject('its_user_preferences', defaultPreferences);

  return {
    preferences,
    updatePreference: updateProperty,
    updatePreferences: merge,
    resetPreferences: reset
  };
};

/**
 * Hook pour gérer l'historique de recherche
 */
export const useSearchHistory = (maxItems = 10) => {
  const {
    value: history,
    push,
    clear,
    setValue
  } = useLocalStorageArray('its_search_history', []);

  const addToHistory = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return;
    
    setValue(prev => {
      // Supprimer les doublons
      const filtered = prev.filter(item => item !== searchTerm);
      // Ajouter au début
      const newHistory = [searchTerm, ...filtered];
      // Limiter la taille
      return newHistory.slice(0, maxItems);
    });
  }, [setValue, maxItems]);

  const removeFromHistory = useCallback((searchTerm) => {
    setValue(prev => prev.filter(item => item !== searchTerm));
  }, [setValue]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory: clear
  };
};

/**
 * Hook pour gérer le cache temporaire avec expiration
 */
export const useLocalStorageCache = (key, ttl = 3600000) => { // TTL par défaut: 1 heure
  const getCacheKey = useCallback((subKey) => `${key}_${subKey}`, [key]);
  
  const getFromCache = useCallback((subKey) => {
    try {
      const cacheKey = getCacheKey(subKey);
      const item = window.localStorage.getItem(cacheKey);
      
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      
      if (Date.now() > expiry) {
        window.localStorage.removeItem(cacheKey);
        return null;
      }
      
      return value;
    } catch (error) {
      console.error('Erreur lors de la lecture du cache:', error);
      return null;
    }
  }, [getCacheKey]);

  const setInCache = useCallback((subKey, value) => {
    try {
      const cacheKey = getCacheKey(subKey);
      const item = {
        value,
        expiry: Date.now() + ttl
      };
      window.localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans le cache:', error);
    }
  }, [getCacheKey, ttl]);

  const removeFromCache = useCallback((subKey) => {
    try {
      const cacheKey = getCacheKey(subKey);
      window.localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
    }
  }, [getCacheKey]);

  const clearCache = useCallback(() => {
    try {
      const keys = Object.keys(window.localStorage);
      keys.forEach(k => {
        if (k.startsWith(key + '_')) {
          window.localStorage.removeItem(k);
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
    }
  }, [key]);

  return {
    getFromCache,
    setInCache,
    removeFromCache,
    clearCache
  };
};