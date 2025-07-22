const axios = require('axios');

async function testDashboardMagasinier() {
    try {
        console.log('Test de l\'endpoint dashboard magasinier...\n');
        
        // 1. Se connecter
        console.log('1. Connexion en tant que magasinier...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'operator.plateforme@its-senegal.com',
            password: 'operator123'
        });
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        console.log('✅ Connexion réussie');
        console.log('User:', user);
        console.log('Magasin ID:', user.magasin_id);
        
        // 2. Appeler le dashboard
        console.log('\n2. Appel de l\'endpoint dashboard...');
        const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/magasinier', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Réponse reçue:');
        console.log('Status:', dashboardResponse.status);
        console.log('Data:', JSON.stringify(dashboardResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testDashboardMagasinier();