const axios = require('axios');

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;

// Données de test pour la réception
const testReceptionData = {
    nomNavire: "MV Test Cargo",
    numeroIMO: "IMO9999999",
    dateArrivee: "2024-01-15",
    port: "Port de Dakar",
    numeroConnaissement: "BL/2024/TEST001",
    agentMaritime: "Agent Test Maritime",
    cargaison: [
        {
            produit: "Maïs jaune",
            quantite: 500,
            unite: "tonnes",
            origine: "Argentine"
        },
        {
            produit: "Soja",
            quantite: 300,
            unite: "tonnes", 
            origine: "Brésil"
        }
    ],
    documentsVerifies: true,
    qualiteVerifiee: true,
    quantiteConfirmee: true,
    observations: "Test de réception depuis le script de test"
};

// Données de connexion test
const testLoginData = {
    email: "manager@its-senegal.com",
    password: "admin"
};

async function testReceptionComplete() {
    console.log('🧪 Test complet de réception de navire');
    console.log('=====================================\n');
    
    let authToken = null;
    
    try {
        // 1. Test de connexion
        console.log('1️⃣ Test de connexion...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, testLoginData);
        
        if (loginResponse.data.success && loginResponse.data.token) {
            authToken = loginResponse.data.token;
            console.log('✅ Connexion réussie');
            console.log('   Token reçu:', authToken.substring(0, 20) + '...');
        } else {
            console.error('❌ Échec de la connexion');
            return;
        }
        
        // 2. Test de récupération des navires existants
        console.log('\n2️⃣ Test récupération navires existants...');
        const naviresResponse = await axios.get(`${API_URL}/navires`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('✅ Navires récupérés:', naviresResponse.data.data.length);
        
        // 3. Test de création de réception
        console.log('\n3️⃣ Test création réception...');
        console.log('   Données envoyées:', JSON.stringify(testReceptionData, null, 2));
        
        const receptionResponse = await axios.post(
            `${API_URL}/navires/reception`, 
            testReceptionData,
            {
                headers: { 
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (receptionResponse.data.success) {
            console.log('✅ Réception créée avec succès!');
            console.log('   Navire ID:', receptionResponse.data.data.id);
            console.log('   Nom:', receptionResponse.data.data.nom_navire);
            console.log('   Cargaison enregistrée:', receptionResponse.data.data.cargaison.length, 'produits');
        } else {
            console.error('❌ Échec de la création de réception');
            console.error('   Erreur:', receptionResponse.data.error);
        }
        
        // 4. Vérification finale
        console.log('\n4️⃣ Vérification finale...');
        const finalCheck = await axios.get(`${API_URL}/navires`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('✅ Vérification terminée');
        console.log('   Total navires après création:', finalCheck.data.data.length);
        
        console.log('\n🎉 Test complet réussi!');
        
    } catch (error) {
        console.error('\n💥 Erreur durant le test:');
        console.error('   Type:', error.name);
        console.error('   Message:', error.message);
        
        if (error.response) {
            console.error('   Status HTTP:', error.response.status);
            console.error('   Headers:', error.response.headers);
            console.error('   Data:', error.response.data);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\n🔴 Le serveur n\'est pas accessible!');
            console.error('   Assurez-vous que le serveur est démarré avec:');
            console.error('   node server-mysql.js ou node start-server.js');
        }
    }
}

// Options en ligne de commande
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node test-reception.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Afficher cette aide');
    console.log('  --login-only   Tester seulement la connexion');
    console.log('  --get-only     Tester seulement la récupération des navires');
    process.exit(0);
}

if (args.includes('--login-only')) {
    console.log('🧪 Test de connexion uniquement');
    console.log('================================\n');
    
    axios.post(`${API_URL}/auth/login`, testLoginData)
        .then(response => {
            console.log('✅ Connexion réussie');
            console.log('Response:', response.data);
        })
        .catch(error => {
            console.error('❌ Erreur connexion:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        });
} else if (args.includes('--get-only')) {
    console.log('🧪 Test de récupération des navires');
    console.log('===================================\n');
    
    // Il faut d'abord se connecter pour avoir un token
    axios.post(`${API_URL}/auth/login`, testLoginData)
        .then(loginResponse => {
            const token = loginResponse.data.token;
            return axios.get(`${API_URL}/navires`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        })
        .then(response => {
            console.log('✅ Navires récupérés');
            console.log('Nombre:', response.data.data.length);
            console.log('Data:', response.data.data);
        })
        .catch(error => {
            console.error('❌ Erreur:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        });
} else {
    // Test complet par défaut
    testReceptionComplete();
}