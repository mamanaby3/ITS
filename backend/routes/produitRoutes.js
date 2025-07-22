const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController-mysql');
const { authenticate, authorize, checkPermission } = require('../middleware/auth-mysql');
const { 
  validateCreateProduit, 
  validateUpdateProduit,
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

router.get('/', 
  produitController.getAllProduits
);

router.get('/categories', 
  produitController.getCategories
);

router.get('/with-stock', 
  produitController.getProduitsWithStock
);

router.get('/stats', 
  produitController.getProduitsStats
);

router.get('/:id', 
  produitController.getProduitById
);

router.post('/', 
  authorize('admin', 'manager'),
  checkPermission('produits.create'),
  validateCreateProduit(),
  handleValidationErrors,
  produitController.createProduit
);

router.put('/:id', 
  authorize('admin', 'manager'),
  checkPermission('produits.update'),
  validateUpdateProduit(),
  handleValidationErrors,
  produitController.updateProduit
);

router.delete('/:id', 
  authorize('admin'),
  checkPermission('produits.delete'),
  produitController.deleteProduit
);

module.exports = router;