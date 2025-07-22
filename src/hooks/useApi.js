
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

/**
 * Hook personnalis� pour g�rer les appels API avec �tat de chargement et gestion d'erreurs
 * @param {Object} options - Options de configuration
 * @param {Function} options.onSuccess - Callback appel� en cas de succ�s
 * @param {Function} options.onError - Callback appel� en cas d'erreur
 * @param {boolean} options.showSuccessToast - Afficher un toast de succ�s
 * @param {boolean} options.showErrorToast - Afficher un toast d'erreur
 */
export const useApi = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  // Fonction g�n�rique pour les appels API
  const callApi = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
      setError(errorMessage);

      if (showErrorToast) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast]);

  return {
    loading,
    error,
    callApi,
    setError
  };
};

/**
 * Hook pour les requ�tes GET avec cache
 * @param {string} queryKey - Cl� unique pour le cache
 * @param {Function} queryFn - Fonction qui retourne la promesse
 * @param {Object} options - Options React Query
 */
export const useApiQuery = (queryKey, queryFn, options = {}) => {
  return useQuery({
    queryKey,
    queryFn,
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des donn�es';
      toast.error(errorMessage);
    },
    ...options
  });
};

/**
 * Hook pour les mutations (POST, PUT, DELETE)
 * @param {Function} mutationFn - Fonction de mutation
 * @param {Object} options - Options de configuration
 */
export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalider le cache si des cl�s sont sp�cifi�es
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Afficher un message de succ�s
      if (options.successMessage !== false) {
        toast.success(options.successMessage || 'Op�ration r�ussie');
      }

      // Callback personnalis�
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
      
      // Afficher un message d'erreur
      if (options.errorMessage !== false) {
        toast.error(options.errorMessage || errorMessage);
      }

      // Callback personnalis�
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options
  });
};

/**
 * Hook pour g�rer le t�l�chargement de fichiers
 */
export const useFileDownload = () => {
  const { loading, callApi } = useApi({ showSuccessToast: false });

  const downloadFile = useCallback(async (url, filename) => {
    try {
      const response = await callApi(
        () => api.get(url, { responseType: 'blob' })
      );

      // Cr�er un lien de t�l�chargement
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(link.href);
      
      toast.success('T�l�chargement r�ussi');
    } catch (error) {
      console.error('Erreur de t�l�chargement:', error);
    }
  }, [callApi]);

  return {
    downloadFile,
    loading
  };
};

/**
 * Hook pour g�rer l'upload de fichiers
 */
export const useFileUpload = (options = {}) => {
  const { loading, callApi } = useApi(options);

  const uploadFile = useCallback(async (url, file, additionalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    // Ajouter des donn�es suppl�mentaires si n�cessaire
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return callApi(
      () => api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    );
  }, [callApi]);

  return {
    uploadFile,
    loading
  };
};

/**
 * Hook pour la pagination
 */
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(1, newPage));
  }, []);

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1); // Retour � la premi�re page
  }, []);

  return {
    page,
    limit,
    nextPage,
    previousPage,
    goToPage,
    changeLimit,
    offset: (page - 1) * limit
  };
};