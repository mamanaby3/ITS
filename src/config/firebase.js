// Configuration Firebase pour ITS Sénégal
// Firebase permet le stockage et la synchronisation en temps réel des données

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration Firebase (à remplacer par vos propres clés)
// Créez un projet sur https://console.firebase.google.com
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "its-senegal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore (base de données)
export const db = getFirestore(app);

// Initialiser l'authentification
export const auth = getAuth(app);

// Collections Firestore
export const COLLECTIONS = {
  USERS: 'users',
  NAVIRES: 'navires',
  PRODUITS: 'produits',
  STOCK: 'stock',
  MOUVEMENTS: 'mouvements',
  CLIENTS: 'clients',
  COMMANDES: 'commandes',
  LIVRAISONS: 'livraisons',
  MAGASINS: 'magasins'
};

export default app;