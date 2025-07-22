const bcrypt = require('bcryptjs');

// Test different password variations
const passwords = ['Admin123!', 'Admin123', 'admin123', 'Password123!'];

passwords.forEach(password => {
  const hash = bcrypt.hashSync(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('---');
});

// Test a specific hash
const testHash = '$2a$10$YourHashedPasswordHere';
console.log('\nTesting against placeholder hash:');
passwords.forEach(password => {
  try {
    const matches = bcrypt.compareSync(password, testHash);
    console.log(`${password}: ${matches}`);
  } catch (error) {
    console.log(`${password}: Error - ${error.message}`);
  }
});