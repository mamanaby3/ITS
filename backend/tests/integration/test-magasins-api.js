const axios = require('axios');

async function testMagasinsAPI() {
  try {
    // First get a token
    console.log('Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@its-senegal.com',
      password: 'Admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now test magasins endpoint
    console.log('\nTesting /api/magasins endpoint...');
    const magasinsResponse = await axios.get('http://localhost:5000/api/magasins', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Success! Magasins data:', JSON.stringify(magasinsResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 500) {
      console.error('\n500 Internal Server Error - Check server logs for details');
      console.error('Response details:', error.response.data);
    }
  }
}

testMagasinsAPI();