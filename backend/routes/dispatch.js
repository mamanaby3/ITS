const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController-mysql');
const { authenticate, authorize } = require('../middleware/auth-mysql');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes pour les dispatches
router.post('/', authorize('admin', 'manager', 'operator'), dispatchController.createDispatch);
router.get('/', dispatchController.getDispatches);
router.get('/progress', dispatchController.getDispatchesProgress);
router.get('/:id', dispatchController.getDispatchById);
router.put('/:id/status', authorize('admin', 'manager'), dispatchController.updateDispatchStatus);

module.exports = router;