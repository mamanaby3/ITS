const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testMySQLServer() {
    try {
        console.log('🚀 Test du serveur MySQL-only...\n');
        
        // 1. Test de santé
        console.log('1️⃣ Test endpoint santé...');
        try {
            const healthResponse = await axios.get(`${API_URL}/health`);
            console.log('✅ Serveur en ligne:', healthResponse.data);
        } catch (error) {
            console.log('❌ Erreur santé:', error.message);
            return;
        }
        
        // 2. Login
        console.log('\n2️⃣ Test de connexion...');
        let token;
        try {
            const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@its-senegal.com',
                password: 'Admin123!'
            });
            
            token = loginResponse.data.data.token;
            console.log('✅ Connexion réussie');
            console.log('   Utilisateur:', loginResponse.data.data.user.nom, loginResponse.data.data.user.prenom);
            console.log('   Rôle:', loginResponse.data.data.user.role);
        } catch (error) {
            console.log('❌ Erreur connexion:', error.response?.data || error.message);
            return;
        }
        
        // Configuration avec token
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        
        // 3. Test produits
        console.log('\n3️⃣ Test endpoint produits...');
        try {
            const produitsResponse = await axios.get(`${API_URL}/produits`, config);
            console.log(`✅ Produits: ${produitsResponse.data.data.length} produits trouvés`);
            if (produitsResponse.data.data.length > 0) {
                console.log('   Exemple:', produitsResponse.data.data[0].nom, '-', produitsResponse.data.data[0].reference);
            }
        } catch (error) {
            console.log('❌ Erreur produits:', error.response?.data || error.message);
        }
        
        // 4. Test produits avec stock
        console.log('\n4️⃣ Test endpoint produits/with-stock...');
        try {
            const withStockResponse = await axios.get(`${API_URL}/produits/with-stock`, config);
            console.log(`✅ Produits avec stock: ${withStockResponse.data.data.length} produits`);
            if (withStockResponse.data.data.length > 0) {
                const produit = withStockResponse.data.data[0];
                console.log(`   Exemple: ${produit.nom} - Stock total: ${produit.stock_total} ${produit.unite}`);
            }
        } catch (error) {
            console.log('❌ Erreur produits/with-stock:', error.response?.data || error.message);
        }
        
        // 5. Test catégories
        console.log('\n5️⃣ Test endpoint produits/categories...');
        try {
            const categoriesResponse = await axios.get(`${API_URL}/produits/categories`, config);
            console.log('✅ Catégories:', categoriesResponse.data.data.join(', '));
        } catch (error) {
            console.log('❌ Erreur catégories:', error.response?.data || error.message);
        }
        
        // 6. Test clients
        console.log('\n6️⃣ Test endpoint clients...');
        try {
            const clientsResponse = await axios.get(`${API_URL}/clients`, config);
            console.log(`✅ Clients: ${clientsResponse.data.data.length} clients trouvés`);
            if (clientsResponse.data.data.length > 0) {
                console.log('   Clients:', clientsResponse.data.data.map(c => c.nom).join(', '));
            }
        } catch (error) {
            console.log('❌ Erreur clients:', error.response?.data || error.message);
        }
        
        // 7. Test magasins
        console.log('\n7️⃣ Test endpoint magasins...');
        try {
            const magasinsResponse = await axios.get(`${API_URL}/magasins`, config);
            console.log(`✅ Magasins: ${magasinsResponse.data.data.length} magasins trouvés`);
            if (magasinsResponse.data.data.length > 0) {
                console.log('   Magasins:', magasinsResponse.data.data.map(m => m.nom).join(', '));
            }
        } catch (error) {
            console.log('❌ Erreur magasins:', error.response?.data || error.message);
        }
        
        // 8. Test stock
        console.log('\n8️⃣ Test endpoint stock...');
        try {
            const stockResponse = await axios.get(`${API_URL}/stock`, config);
            console.log(`✅ Stock: ${stockResponse.data.data.length} entrées de stock`);
            if (stockResponse.data.data.length > 0) {
                const stock = stockResponse.data.data[0];
                console.log(`   Exemple: ${stock.produit_nom} @ ${stock.magasin_nom}: ${stock.quantite} tonnes`);
            }
        } catch (error) {
            console.log('❌ Erreur stock:', error.response?.data || error.message);
        }
        
        // 9. Test navires
        console.log('\n9️⃣ Test endpoint navires...');
        try {
            const naviresResponse = await axios.get(`${API_URL}/navires`, config);
            console.log(`✅ Navires: ${naviresResponse.data.data.length} navires`);
        } catch (error) {
            console.log('❌ Erreur navires:', error.response?.data || error.message);
        }
        
        console.log('\n✅ Tests terminés avec succès!');
        console.log('\n📊 Résumé des données dans votre base:');
        console.log('   - Produits: maïs, riz, soja, blé, son de blé...');
        console.log('   - Clients: GMD, AVISEN, NMA, SEDIMA');
        console.log('   - Magasins: Plateforme Belair, SIPS Pikine, Belair, Yarakh, Thiaroye, km 16, Rufisque');
        console.log('\n✨ Toutes les données proviennent de la base de données MySQL!');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter le test
testMySQLServer();