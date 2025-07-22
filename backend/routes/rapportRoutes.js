const express = require('express');
const router = express.Router();
const rapportController = require('../controllers/rapportController');
const { authenticate, authorize, checkMagasinAccess, checkPermission } = require('../middleware/auth');

router.use(authenticate);

router.get('/stock', 
  checkPermission('rapports.view'),
  checkMagasinAccess,
  rapportController.getStockReport
);

router.get('/mouvements', 
  checkPermission('rapports.view'),
  checkMagasinAccess,
  rapportController.getMovementReport
);

router.get('/entrees', 
  authorize('admin', 'manager'),
  checkPermission('rapports.view'),
  checkMagasinAccess,
  rapportController.getEntreesReport
);

router.get('/valorisation', 
  authorize('admin', 'manager'),
  checkPermission('rapports.view'),
  checkMagasinAccess,
  rapportController.getInventoryValuation
);

router.get('/activite', 
  authorize('admin', 'manager'),
  checkPermission('rapports.view'),
  checkMagasinAccess,
  rapportController.getActivityReport
);

module.exports = router;