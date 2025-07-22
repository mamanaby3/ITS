import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personnalis� pour g�rer le localStorage avec React
 * @param {string} key - La cl� du localStorage
 * @param {any} defaultValue - La valeur par d�faut si aucune valeur n'est trouv�e
 * @param {Object} options - Options de configuration
 * @param {boolean} options.serialize - Si true, s�rialise/d�s�rialise automatiquement les objets (d�faut: true)
 * @param {number} options.syncInterval - Intervalle en ms pour synchroniser avec d'autres onglets (d�faut: null)
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
      console.error(`Erreur lors de la lecture du localStorage pour la cl� "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, serialize]);

  // �tat initial
  const [storedValue, setStoredValue] = useState(readFromStorage);

  // Fonction pour �crire dans le localStorage
  const setValue = useCallback((value) => {
    try {
      // Permettre les fonctions de mise � jour
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Sauvegarder dans l'�tat
      setStoredValue(valueToStore);
      
      // Sauvegarder dans le localStorage
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        const serializedValue = serialize ? JSON.stringify(valueToStore) : valueToStore;
        window.localStorage.setItem(key, serializedValue);
      }
      
      // D�clencher un �v�nement personnalis� pour synchroniser avec d'autres onglets
      window.dispatchEvent(new CustomEvent('localStorage-update', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Erreur lors de l'�criture dans le localStorage pour la cl� "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      window.localStorage.removeItem(key);
      
      // D�clencher un �v�nement personnalis�
      window.dispatchEvent(new CustomEvent('localStorage-update', {
        detail: { key, value: null }
      }));
    } catch (error) {
      console.error(`Erreur lors de la suppression du localStorage pour la cl� "${key}":`, error);
    }
  }, [key, defaultValue]);

  // �couter les changements du localStorage depuis d'autres onglets
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

    // �couter l'�v�nement storage natif (changements depuis d'autres onglets)
    window.addEventListener('storage', handleStorageChange);

    // �couter notre �v�nement personnalis� (changements depuis le m�me onglet)
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

  // Synchronisation p�riodique si demand�e
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
 * Hook pour g�rer un objet dans le localStorage avec des m�thodes utilitaires
 */
export const useLocalStorageObject = (key, defaultValue = {}) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);

  // Mettre � jour une propri�t� sp�cifique
  const updateProperty = useCallback((propertyKey, propertyValue) => {
    setValue(prev => ({
      ...prev,
      [propertyKey]: propertyValue
    }));
  }, [setValue]);

  // Supprimer une propri�t�
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

  // R�initialiser � la valeur par d�faut
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
 * Hook pour g�rer un tableau dans le localStorage avec des m�thodes utilitaires
 */
export const useLocalStorageArray = (key, defaultValue = []) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);

  // Ajouter un �l�ment
  const push = useCallback((item) => {
    setValue(prev => [...prev, item]);
  }, [setValue]);

  // Ajouter plusieurs �l�ments
  const pushMany = useCallback((items) => {
    setValue(prev => [...prev, ...items]);
  }, [setValue]);

  // Supprimer un �l�ment par index
  const removeAt = useCallback((index) => {
    setValue(prev => prev.filter((_, i) => i !== index));
  }, [setValue]);

  // Supprimer un �l�ment par pr�dicat
  const removeWhere = useCallback((predicate) => {
    setValue(prev => prev.filter(item => !predicate(item)));
  }, [setValue]);

  // Mettre � jour un �l�ment par index
  const updateAt = useCallback((index, newItem) => {
    setValue(prev => prev.map((item, i) => i === index ? newItem : item));
  }, [setValue]);

  // Vider le tableau
  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  // R�initialiser � la valeur par d�faut
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
 * Hook pour g�rer les pr�f�rences utilisateur
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
 * Hook pour g�rer l'historique de recherche
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
      // Ajouter au d�but
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
 * Hook pour g�rer le cache temporaire avec expiration
 */
export const useLocalStorageCache = (key, ttl = 3600000) => { // TTL par d�faut: 1 heure
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
      console.error('Erreur lors de l\'�criture dans le cache:', error);
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