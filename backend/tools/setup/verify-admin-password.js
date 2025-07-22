const bcrypt = require('bcryptjs');

// The actual hash from the database
const actualHash = '$2a$10$Z0Yf4LWu27EGpLkby1WEmeHboQTg5kE2DXPNp4aKBAbXnXxDULoGm';

// Test different password variations
const passwords = ['Admin123!', 'Admin123', 'admin123', 'Password123!', 'admin', 'password'];

console.log('Testing passwords against the actual hash:');
passwords.forEach(password => {
  try {
    const matches = bcrypt.compareSync(password, actualHash);
    console.log(`${password}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
  } catch (error) {
    console.log(`${password}: Error - ${error.message}`);
  }
});