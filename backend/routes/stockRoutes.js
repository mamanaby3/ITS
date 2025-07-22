const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController-mysql');
const { authenticate, authorize, checkMagasinAccess, checkPermission } = require('../middleware/auth');
const { 
  validateAddStock, 
  validateRemoveStock,
  validateTransferStock,
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

router.get('/all', 
  authorize('admin', 'manager'),
  stockController.getAllStocks
);

router.get('/magasin/:magasin_id', 
  checkMagasinAccess,
  stockController.getStockByMagasin
);

router.get('/mouvements', 
  checkMagasinAccess,
  stockController.getStockMovements
);

router.get('/disponible',
  authenticate,
  stockController.getStockDisponible
);

// router.get('/entrees-jour/:magasin_id',
//   checkMagasinAccess,
//   stockController.getEntreesJour
// );

router.post('/entree', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('stock.entree'),
  checkMagasinAccess,
  validateAddStock(),
  handleValidationErrors,
  stockController.addStock
);

router.post('/sortie', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('stock.sortie'),
  checkMagasinAccess,
  validateRemoveStock(),
  handleValidationErrors,
  stockController.removeStock
);

router.post('/transfert', 
  authorize('admin', 'manager'),
  checkPermission('stock.transfert'),
  validateTransferStock(),
  handleValidationErrors,
  stockController.transferStock
);

router.post('/ajustement', 
  authorize('admin', 'manager'),
  checkPermission('stock.ajustement'),
  checkMagasinAccess,
  handleValidationErrors,
  stockController.adjustStock
);

module.exports = router;