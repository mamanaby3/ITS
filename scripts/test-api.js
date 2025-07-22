import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🔍 Testing API endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/auth/status', name: 'Auth Status' },
    { method: 'GET', path: '/produits', name: 'Products List' },
    { method: 'GET', path: '/stock', name: 'Stock List' },
    { method: 'GET', path: '/clients', name: 'Clients List' },
    { method: 'GET', path: '/commandes', name: 'Orders List' },
    { method: 'GET', path: '/livraisons', name: 'Deliveries List' },
    { method: 'GET', path: '/rapports/stats', name: 'Reports Stats' }
  ];
  
  // First check if server is running
  try {
    console.log('1. Checking if API server is running...');
    await axios.get(`${API_BASE_URL}/auth/status`, { timeout: 5000 });
    console.log('✅ API server is running\n');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ API server is not running!');
      console.error('Please start the backend server with: npm start\n');
      return;
    }
  }
  
  // Test each endpoint
  console.log('2. Testing individual endpoints:');
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true // Accept any status
      });
      
      if (response.status === 401) {
        console.log(`⚠️  ${endpoint.name}: Requires authentication (401)`);
      } else if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (200)`);
      } else {
        console.log(`❓ ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed - ${error.message}`);
    }
  }
  
  // Test login endpoint
  console.log('\n3. Testing authentication:');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@its-sn.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login endpoint works');
      console.log(`   Token received: ${loginResponse.data.token.substring(0, 20)}...`);
      
      // Test authenticated request
      const authResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      if (authResponse.data.user) {
        console.log('✅ Authenticated requests work');
        console.log(`   User: ${authResponse.data.user.email} (${authResponse.data.user.role})`);
      }
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n✅ API test completed!');
}

testAPI().catch(console.error);