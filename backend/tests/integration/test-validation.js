const { validationResult } = require('express-validator');
const validator = require('validator');

console.log('🔍 Test de normalisation d\'email\n');

const email = 'manager@its-senegal.com';
console.log('Email original:', email);

// Test normalizeEmail
const normalized = validator.normalizeEmail(email);
console.log('Email normalisé:', normalized);

console.log('Sont-ils identiques?', email === normalized);

// Test avec d'autres emails
const testEmails = [
  'admin@its-senegal.com',
  'Admin@ITS-Senegal.com',
  'manager+test@its-senegal.com',
  'manager.test@its-senegal.com'
];

console.log('\n📧 Tests de normalisation:');
testEmails.forEach(testEmail => {
  const norm = validator.normalizeEmail(testEmail);
  console.log(`${testEmail} → ${norm} (changé: ${testEmail !== norm})`);
});