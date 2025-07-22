// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook personnalis� pour le debouncing
 * Retarde l'ex�cution d'une valeur jusqu'� ce qu'elle arr�te de changer pendant le d�lai sp�cifi�
 * 
 * @param {any} value - La valeur � debouncer
 * @param {number} delay - Le d�lai en millisecondes (par d�faut 500ms)
 * @returns {any} La valeur debounc�e
 */
export const useDebounce = (value, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Cr�er un timer qui met � jour la valeur apr�s le d�lai
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Nettoyer le timer si la valeur change avant la fin du d�lai
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook pour cr�er une fonction debounc�e
 * 
 * @param {Function} callback - La fonction � debouncer
 * @param {number} delay - Le d�lai en millisecondes
 * @returns {Function} La fonction debounc�e
 */
export const useDebouncedCallback = (callback, delay = 500) => {
    const [timer, setTimer] = useState(null);

    const debouncedCallback = (...args) => {
        // Annuler le timer pr�c�dent s'il existe
        if (timer) {
            clearTimeout(timer);
        }

        // Cr�er un nouveau timer
        const newTimer = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimer(newTimer);
    };

    // Nettoyer le timer lors du d�montage du composant
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
 * Hook pour le debouncing avec �tat de chargement
 * Utile pour les recherches ou les appels API
 * 
 * @param {any} value - La valeur � debouncer
 * @param {number} delay - Le d�lai en millisecondes
 * @returns {Object} { value: valeur debounc�e, isDebouncing: boolean }
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