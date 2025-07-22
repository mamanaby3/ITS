// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour le debouncing
 * Retarde l'exécution d'une valeur jusqu'à ce qu'elle arrête de changer pendant le délai spécifié
 * 
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes (par défaut 500ms)
 * @returns {any} La valeur debouncée
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Créer un timer qui met à jour la valeur après le délai
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer si la valeur change avant la fin du délai
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook pour créer une fonction debouncée
 * 
 * @param {Function} callback - La fonction à debouncer
 * @param {number} delay - Le délai en millisecondes
 * @returns {Function} La fonction debouncée
 */
export const useDebouncedCallback = (callback, delay = 500) => {
    const [timer, setTimer] = useState(null);

    const debouncedCallback = (...args) => {
        // Annuler le timer précédent s'il existe
        if (timer) {
            clearTimeout(timer);
        }

        // Créer un nouveau timer
        const newTimer = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimer(newTimer);
    };

    // Nettoyer le timer lors du démontage du composant
    useEffect(() => {
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [timer]);

    return debouncedCallback;
};

/**
 * Hook pour le debouncing avec état de chargement
 * Utile pour les recherches ou les appels API
 * 
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes
 * @returns {Object} { value: valeur debouncée, isDebouncing: boolean }
 */
export const useDebouncedState = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const [isDebouncing, setIsDebouncing] = useState(false);

    useEffect(() => {
        setIsDebouncing(true);

        const timer = setTimeout(() => {
            setDebouncedValue(value);
            setIsDebouncing(false);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return { value: debouncedValue, isDebouncing };
};

export default useDebounce;