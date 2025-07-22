const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const { authenticate, authorize, checkMagasinAccess, checkPermission } = require('../middleware/auth');
const { 
  validateCreateCommande, 
  validateUpdateCommandeStatus,
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

router.get('/', 
  checkMagasinAccess,
  commandeController.getAllCommandes
);

router.get('/:id', 
  commandeController.getCommandeById
);

router.post('/', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('commandes.create'),
  checkMagasinAccess,
  validateCreateCommande(),
  handleValidationErrors,
  commandeController.createCommande
);

router.put('/:id/status', 
  authorize('admin', 'manager', 'operator'),
  checkPermission('commandes.update'),
  validateUpdateCommandeStatus(),
  handleValidationErrors,
  commandeController.updateCommandeStatus
);

router.delete('/:id', 
  authorize('admin', 'manager'),
  checkPermission('commandes.delete'),
  commandeController.deleteCommande
);

module.exports = router;