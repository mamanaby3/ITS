const jwt = require('jsonwebtoken');

// Token de test
const token = process.argv[2];

if (!token) {
  console.log('Usage: node debug-token.js <token>');
  process.exit(1);
}

require('dotenv').config();

console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Default secret:', 'its_maritime_stock_secret');

try {
  // Try with env secret
  const decoded1 = jwt.verify(token, process.env.JWT_SECRET || 'its_maritime_stock_secret');
  console.log('Token valid with env secret:', decoded1);
} catch (error) {
  console.log('Error with env secret:', error.message);
}

try {
  // Try with default secret
  const decoded2 = jwt.verify(token, 'its_maritime_stock_secret');
  console.log('Token valid with default secret:', decoded2);
} catch (error) {
  console.log('Error with default secret:', error.message);
}

try {
  // Decode without verification
  const decoded = jwt.decode(token);
  console.log('Token decoded (no verification):', decoded);
} catch (error) {
  console.log('Error decoding:', error.message);
}