// Service Firebase pour la gestion des navires
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, COLLECTIONS } from '../../config/firebase';

const naviresFirebaseService = {
  // Récupérer tous les navires en temps réel
  subscribeToNavires: (callback) => {
    const q = query(
      collection(db, COLLECTIONS.NAVIRES), 
      orderBy('date_arrivee', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const navires = [];
      snapshot.forEach((doc) => {
        navires.push({ id: doc.id, ...doc.data() });
      });
      callback(navires);
    });
  },

  // Récupérer tous les navires (une fois)
  getAll: async () => {
    try {
      const q = query(
        collection(db, COLLECTIONS.NAVIRES), 
        orderBy('date_arrivee', 'desc')
      );
      const snapshot = await getDocs(q);
      const navires = [];
      snapshot.forEach((doc) => {
        navires.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: navires };
    } catch (error) {
      console.error('Erreur récupération navires Firebase:', error);
      throw error;
    }
  },

  // Créer une nouvelle réception
  createReception: async (data) => {
    try {
      const navireData = {
        nom_navire: data.nomNavire,
        numero_imo: data.numeroIMO,
        date_arrivee: data.dateArrivee,
        port: data.port,
        statut: 'receptionne',
        numero_connaissement: data.numeroConnaissement || '',
        agent_maritime: data.agentMaritime || '',
        date_reception: serverTimestamp(),
        reception_user: auth.currentUser?.email || 'system',
        observations: data.observations || '',
        cargaison: data.cargaison.map(c => ({
          produit: c.produit,
          quantite: parseFloat(c.quantite),
          unite: c.unite || 'tonnes',
          origine: c.origine
        })),
        dispatching: [],
        documents_verifies: data.documentsVerifies,
        qualite_verifiee: data.qualiteVerifiee,
        quantite_confirmee: data.quantiteConfirmee,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.NAVIRES), navireData);
      
      // Ajouter l'entrée dans l'historique des mouvements
      await addDoc(collection(db, COLLECTIONS.MOUVEMENTS), {
        type: 'reception_navire',
        navire_id: docRef.id,
        navire_nom: data.nomNavire,
        user: auth.currentUser?.email || 'system',
        date: serverTimestamp(),
        details: navireData.cargaison
      });

      return { 
        success: true, 
        data: { id: docRef.id, ...navireData },
        message: 'Navire réceptionné avec succès' 
      };
    } catch (error) {
      console.error('Erreur création réception Firebase:', error);
      throw error;
    }
  },

  // Dispatcher la cargaison
  dispatchCargaison: async (navireId, distributions) => {
    try {
      const navireRef = doc(db, COLLECTIONS.NAVIRES, navireId);
      
      // Préparer les données de distribution
      const dispatchingData = distributions.flatMap(dist => 
        dist.dispatches
          .filter(d => d.quantite > 0)
          .map(d => ({
            magasin_id: d.magasinId,
            produit_id: dist.produitId,
            produit: dist.produit,
            quantite: d.quantite,
            date: serverTimestamp(),
            user: auth.currentUser?.email || 'system'
          }))
      );

      // Mettre à jour le navire
      await updateDoc(navireRef, {
        statut: 'dispatche',
        dispatching: dispatchingData,
        date_dispatching: serverTimestamp(),
        dispatching_user: auth.currentUser?.email || 'system',
        updated_at: serverTimestamp()
      });

      // Ajouter dans l'historique des mouvements pour chaque magasin
      for (const dispatch of dispatchingData) {
        await addDoc(collection(db, COLLECTIONS.MOUVEMENTS), {
          type: 'entree',
          source: 'navire',
          navire_id: navireId,
          magasin_id: dispatch.magasin_id,
          produit: dispatch.produit,
          quantite: dispatch.quantite,
          user: auth.currentUser?.email || 'system',
          date: serverTimestamp()
        });

        // Mettre à jour le stock du magasin
        const stockQuery = query(
          collection(db, COLLECTIONS.STOCK),
          where('magasin_id', '==', dispatch.magasin_id),
          where('produit', '==', dispatch.produit)
        );
        
        const stockSnapshot = await getDocs(stockQuery);
        if (!stockSnapshot.empty) {
          // Mettre à jour le stock existant
          const stockDoc = stockSnapshot.docs[0];
          await updateDoc(doc(db, COLLECTIONS.STOCK, stockDoc.id), {
            quantite: stockDoc.data().quantite + dispatch.quantite,
            updated_at: serverTimestamp()
          });
        } else {
          // Créer un nouveau stock
          await addDoc(collection(db, COLLECTIONS.STOCK), {
            magasin_id: dispatch.magasin_id,
            produit: dispatch.produit,
            quantite: dispatch.quantite,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      }

      return { 
        success: true, 
        message: 'Cargaison dispatchée avec succès' 
      };
    } catch (error) {
      console.error('Erreur dispatching Firebase:', error);
      throw error;
    }
  }
};

export default naviresFirebaseService;