const express = require('express');
const router = express.Router();
const magasinController = require('../controllers/magasinMysqlController');
const { authenticate } = require('../middleware/auth-mysql');

// Routes
router.get('/', authenticate, magasinController.getAllMagasins);
router.get('/:id', authenticate, magasinController.getMagasinById);
router.get('/:id/stock', authenticate, magasinController.getMagasinStock);

module.exports = router;