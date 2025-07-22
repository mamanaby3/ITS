const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    try {
        console.log('🔄 Test des endpoints...\n');
        
        // 1. Login
        console.log('1️⃣ Test de connexion...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@its-senegal.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Connexion réussie');
        
        // Configuration avec token
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        
        // 2. Test produits
        console.log('\n2️⃣ Test endpoint produits...');
        try {
            const produitsResponse = await axios.get(`${API_URL}/produits`, config);
            console.log(`✅ Produits: ${produitsResponse.data.data.length} produits trouvés`);
        } catch (error) {
            console.log('❌ Erreur produits:', error.response?.data || error.message);
        }
        
        // 3. Test produits with-stock
        console.log('\n3️⃣ Test endpoint produits/with-stock...');
        try {
            const withStockResponse = await axios.get(`${API_URL}/produits/with-stock`, config);
            console.log(`✅ Produits avec stock: ${withStockResponse.data.data.length} produits`);
        } catch (error) {
            console.log('❌ Erreur produits/with-stock:', error.response?.data || error.message);
        }
        
        // 4. Test stats produits
        console.log('\n4️⃣ Test endpoint produits/stats...');
        try {
            const statsResponse = await axios.get(`${API_URL}/produits/stats`, config);
            console.log('✅ Stats produits:', statsResponse.data.data);
        } catch (error) {
            console.log('❌ Erreur produits/stats:', error.response?.data || error.message);
        }
        
        // 5. Test clients
        console.log('\n5️⃣ Test endpoint clients...');
        try {
            const clientsResponse = await axios.get(`${API_URL}/clients`, config);
            console.log(`✅ Clients: ${clientsResponse.data.data.length} clients trouvés`);
        } catch (error) {
            console.log('❌ Erreur clients:', error.response?.data || error.message);
        }
        
        // 6. Test magasins
        console.log('\n6️⃣ Test endpoint magasins...');
        try {
            const magasinsResponse = await axios.get(`${API_URL}/magasins`, config);
            console.log(`✅ Magasins: ${magasinsResponse.data.data.length} magasins trouvés`);
        } catch (error) {
            console.log('❌ Erreur magasins:', error.response?.data || error.message);
        }
        
        console.log('\n✅ Tests terminés');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testEndpoints();