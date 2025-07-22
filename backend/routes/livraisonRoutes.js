const express = require('express');
const router = express.Router();
const livraisonController = require('../controllers/livraisonController-mysql');
const { authenticate, authorize, checkMagasinAccess, checkPermission } = require('../middleware/auth');
const { 
  validateCreateLivraison, 
  validateUpdateLivraisonStatus,
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

// Routes simplifiées sans validation complexe
router.get('/', livraisonController.getAllLivraisons);
router.get('/today', livraisonController.getTodayLivraisons);
router.get('/:id', livraisonController.getLivraisonById);
router.post('/', livraisonController.createLivraison);
router.put('/:id', livraisonController.updateLivraison);
router.put('/:id/status', livraisonController.updateLivraisonStatus);
router.delete('/:id', livraisonController.cancelLivraison);

module.exports = router;