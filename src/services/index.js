// src/services/index.js
// Ce fichier permet de basculer entre les services API et Mock

// Vérifier si on est en mode développement avec mock
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_URL;

// Import des services API
import stockApiService from './stockApi';
import produitsApiService from './produitsApi';
import magasinsApiService from './magasinsApi';
import clientsApiService from './clientsApi';
import naviresApiService from './navires';

// Import des services Mock
import stockMockService from './stock';
import produitsMockService from './produits';
import magasinsMockService from './magasins';
import clientsMockService from './clients';

// Exporter les services appropriés selon l'environnement
export const stockService = USE_MOCK_API ? stockMockService : stockApiService;
export const produitsService = USE_MOCK_API ? produitsMockService : produitsApiService;
export const magasinsService = USE_MOCK_API ? magasinsMockService : magasinsApiService;
export const clientsService = USE_MOCK_API ? clientsMockService : clientsApiService;
export const naviresService = naviresApiService; // Toujours utiliser l'API pour navires

// Log le mode utilisé
if (USE_MOCK_API) {
    console.log('🔧 Mode Mock API activé');
} else {
    console.log('🌐 Mode API réelle activé - URL:', import.meta.env.VITE_API_URL);
}

export default {
    stockService,
    produitsService,
    magasinsService,
    clientsService,
    naviresService
};