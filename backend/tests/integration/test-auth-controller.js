require('dotenv').config();
const authController = require('./controllers/authController');
const { validationResult } = require('express-validator');

// Simuler une requête
const mockReq = {
  body: {
    email: 'manager@its-senegal.com',
    password: 'manager123'
  }
};

// Simuler une réponse
let responseStatus = null;
let responseData = null;

const mockRes = {
  status: (code) => {
    responseStatus = code;
    return mockRes;
  },
  json: (data) => {
    responseData = data;
    console.log(`\n📤 Réponse (${responseStatus || 200}):`);
    console.log(JSON.stringify(data, null, 2));
    return mockRes;
  }
};

// Ajouter une fonction mock pour validationResult
mockReq.validationResult = () => ({
  isEmpty: () => true,
  array: () => []
});

console.log('🔍 Test direct du contrôleur d\'authentification\n');
console.log('📨 Requête:', mockReq.body);

// Appeler directement le contrôleur
authController.login(mockReq, mockRes).catch(error => {
  console.error('\n❌ Erreur non gérée:', error);
});