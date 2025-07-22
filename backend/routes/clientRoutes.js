const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController-mysql');
const { authenticate, authorize, checkMagasinAccess, checkPermission } = require('../middleware/auth');
const { 
  validateCreateClient, 
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

router.get('/', 
  checkMagasinAccess,
  clientController.getAllClients
);

router.get('/stats', 
  clientController.getClientsStats
);

router.get('/:id', 
  clientController.getClientById
);

router.get('/:id/stats', 
  clientController.getClientStats
);

router.post('/', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('clients.create'),
  checkMagasinAccess,
  validateCreateClient(),
  handleValidationErrors,
  clientController.createClient
);

router.put('/:id', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('clients.update'),
  handleValidationErrors,
  clientController.updateClient
);

router.delete('/:id', 
  authorize('admin', 'manager'),
  checkPermission('clients.delete'),
  clientController.deleteClient
);

module.exports = router;