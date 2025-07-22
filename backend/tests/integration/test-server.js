const axios = require('axios');

async function testServer() {
  console.log('=== Test de connexion au serveur ===\n');
  
  // 1. Test de santé
  try {
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Serveur en ligne');
    console.log('Status:', health.data);
  } catch (error) {
    console.log('❌ Serveur hors ligne ou erreur');
    console.log('Erreur:', error.message);
    return;
  }
  
  // 2. Test de l'endpoint de login
  try {
    console.log('\n=== Test de login ===');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'operator.plateforme@its-senegal.com',
      password: 'operator123'
    });
    
    console.log('✅ Login réussi');
    console.log('Token:', response.data.data.token.substring(0, 50) + '...');
    console.log('User:', response.data.data.user);
  } catch (error) {
    console.log('❌ Erreur de login');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data);
    console.log('URL tentée:', error.config?.url);
  }
}

testServer();
EOF < /dev/null
