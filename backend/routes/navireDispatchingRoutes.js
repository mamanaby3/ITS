const express = require('express');
const router = express.Router();
const navireDispatchingController = require('../controllers/navireDispatchingController');
const { authenticate, authorize } = require('../middleware/auth-mysql');

// Routes pour les dispatches en attente
router.get('/en-attente', authenticate, navireDispatchingController.getDispatchesEnAttente);

// Route pour réceptionner un dispatch
router.post('/:dispatch_id/receptionner', authenticate, authorize('operator'), navireDispatchingController.receptionnerDispatch);

// Route pour l'historique des réceptions
router.get('/historique', authenticate, navireDispatchingController.getHistoriqueReceptions);

// Route pour l'historique des dispatches
router.get('/historique-dispatches', authenticate, navireDispatchingController.getHistoriqueDispatches);

// Route pour le rapport des écarts (managers uniquement)
router.get('/ecarts', authenticate, authorize('manager'), navireDispatchingController.getRapportEcarts);

// Route pour récupérer le stock du magasin depuis navire_dispatching
router.get('/stock-magasin', authenticate, navireDispatchingController.getStockMagasin);

// Route pour récupérer uniquement les totaux du magasin
router.get('/totaux-magasin', authenticate, navireDispatchingController.getTotauxMagasin);

// Route pour récupérer le stock total de tous les magasins
router.get('/stock-total-global', authenticate, navireDispatchingController.getStockTotalTousMagasins);

// Route pour dispatcher vers un magasin
router.post('/dispatcher', authenticate, authorize('manager'), navireDispatchingController.dispatcherVersMagasin);

// Route pour dispatcher vers un client
router.post('/dispatcher-client', authenticate, authorize('manager'), navireDispatchingController.dispatcherVersClient);

// Route pour récupérer le stock détaillé par produit et par magasin
router.get('/stock-detaille-produits', authenticate, navireDispatchingController.getStockDetailleParProduit);

// Route pour récupérer les mouvements (entrées et sorties) par magasin
router.get('/mouvements-magasins', authenticate, navireDispatchingController.getMouvementsMagasins);

module.exports = router;