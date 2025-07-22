const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // 1. Login first to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@its-senegal.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('Login successful, token received');
    console.log('Token:', token);
    
    // 2. Test magasins endpoint
    console.log('\n2. Testing /api/magasins...');
    try {
      const magasinsResponse = await axios.get(`${API_URL}/magasins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Magasins response:', magasinsResponse.data.success ? 'Success' : 'Failed');
      console.log('Number of magasins:', magasinsResponse.data.data?.length || 0);
    } catch (error) {
      console.error('Magasins error:', error.response?.data || error.message);
    }
    
    // 3. Test mouvements endpoint
    console.log('\n3. Testing /api/mouvements...');
    try {
      const mouvementsResponse = await axios.get(`${API_URL}/mouvements`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date_debut: '2025-06-20',
          date_fin: '2025-07-20',
          limit: 10
        }
      });
      console.log('Mouvements response:', mouvementsResponse.data.success ? 'Success' : 'Failed');
      console.log('Number of mouvements:', mouvementsResponse.data.data?.length || 0);
    } catch (error) {
      console.error('Mouvements error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAPI();