// src/services/api.js
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Créer une instance axios avec la configuration de base
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('its_auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter le magasin actuel si nécessaire
    const currentMagasin = localStorage.getItem('its_current_magasin');
    if (currentMagasin) {
      config.headers['X-Magasin-Id'] = currentMagasin;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  (response) => {
    // Retourner directement les données
    return response.data;
  },
  (error) => {
    // Gérer les erreurs globalement
    if (error.response) {
      // Erreur de réponse du serveur
      switch (error.response.status) {
        case 401:
          // Non autorisé - rediriger vers la connexion
          localStorage.removeItem('its_auth_token');
          localStorage.removeItem('its_user_data');
          window.location.href = '/login';
          break;
          
        case 403:
          // Interdit - afficher un message d'erreur
          console.error('Accès refusé');
          break;
          
        case 404:
          // Non trouvé
          console.error('Ressource non trouvée');
          break;
          
        case 422:
          // Erreur de validation
          console.error('Erreur de validation:', error.response.data);
          break;
          
        case 500:
          // Erreur serveur
          console.error('Erreur serveur');
          break;
      }
      
      // Retourner l'erreur avec un message personnalisé
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          'Une erreur est survenue';
      
      return Promise.reject({
        status: error.response.status,
        message: errorMessage,
        data: error.response.data
      });
    } else if (error.request) {
      // Pas de réponse du serveur
      return Promise.reject({
        status: 0,
        message: 'Impossible de contacter le serveur',
        data: null
      });
    } else {
      // Erreur de configuration
      return Promise.reject({
        status: -1,
        message: error.message,
        data: null
      });
    }
  }
);

// Fonctions utilitaires pour les requêtes
const api = {
  // GET
  get: (url, params = {}) => {
    return apiClient.get(url, { params });
  },
  
  // POST
  post: (url, data = {}) => {
    return apiClient.post(url, data);
  },
  
  // PUT
  put: (url, data = {}) => {
    return apiClient.put(url, data);
  },
  
  // PATCH
  patch: (url, data = {}) => {
    return apiClient.patch(url, data);
  },
  
  // DELETE
  delete: (url) => {
    return apiClient.delete(url);
  },
  
  // Upload de fichiers
  upload: (url, formData, onUploadProgress) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  }
};

export default api;