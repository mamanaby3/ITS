const express = require('express');
const router = express.Router();
const mouvementsController = require('../controllers/mouvementsMysqlController');
const { authenticate } = require('../middleware/auth-mysql');

// Routes
router.get('/', authenticate, mouvementsController.getAllMouvements);
router.post('/', authenticate, mouvementsController.createMouvement);

module.exports = router;