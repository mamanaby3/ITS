const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { 
  validateCreateUser, 
  validateUpdateUser,
  validatePasswordReset,
  handleValidationErrors 
} = require('../middleware/validation');

router.use(authenticate);

router.get('/', 
  authorize('admin', 'manager'),
  userController.getAllUsers
);

router.get('/:id', 
  authorize('admin', 'manager'),
  userController.getUserById
);

router.post('/', 
  authorize('admin'),
  validateCreateUser(),
  handleValidationErrors,
  userController.createUser
);

router.put('/:id', 
  authorize('admin'),
  validateUpdateUser(),
  handleValidationErrors,
  userController.updateUser
);

router.put('/:id/password', 
  authorize('admin'),
  validatePasswordReset(),
  handleValidationErrors,
  userController.resetPassword
);

router.delete('/:id', 
  authorize('admin'),
  userController.deleteUser
);

module.exports = router;