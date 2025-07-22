const http = require('http');

const testData = JSON.stringify({
    email: "manager@its-senegal.com",
    password: "manager123"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

console.log('🧪 Test de connexion simple avec Node.js HTTP...\n');

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\nRéponse:');
        try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
            
            if (jsonData.success && jsonData.token) {
                console.log('\n✅ Connexion réussie!');
                console.log('Token:', jsonData.token.substring(0, 20) + '...');
                
                // Maintenant tester l'endpoint navires
                testNavires(jsonData.token);
            } else {
                console.log('\n❌ Échec de connexion');
            }
        } catch (error) {
            console.log('Réponse brute:', data);
            console.error('Erreur parsing JSON:', error);
        }
    });
});

req.on('error', (error) => {
    console.error('Erreur requête:', error);
});

req.write(testData);
req.end();

function testNavires(token) {
    console.log('\n🚢 Test endpoint navires...');
    
    const naviresOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/navires',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    const naviresReq = http.request(naviresOptions, (res) => {
        console.log(`Status navires: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\nRéponse navires:');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
                
                if (jsonData.success) {
                    console.log(`\n✅ ${jsonData.data.length} navires trouvés`);
                    
                    // Test réception
                    testReception(token);
                } else {
                    console.log('\n❌ Échec récupération navires');
                }
            } catch (error) {
                console.log('Réponse brute:', data);
                console.error('Erreur parsing JSON:', error);
            }
        });
    });
    
    naviresReq.on('error', (error) => {
        console.error('Erreur requête navires:', error);
    });
    
    naviresReq.end();
}

function testReception(token) {
    console.log('\n📦 Test création réception navire...');
    
    const receptionData = JSON.stringify({
        nomNavire: "MV Test Simple",
        numeroIMO: "IMO8888888",
        dateArrivee: "2024-01-15",
        port: "Port de Dakar",
        numeroConnaissement: "BL/2024/SIMPLE001",
        agentMaritime: "Agent Test",
        cargaison: [
            {
                produit: "Maïs test",
                quantite: 100,
                unite: "tonnes",
                origine: "Test"
            }
        ],
        documentsVerifies: true,
        qualiteVerifiee: true,
        quantiteConfirmee: true,
        observations: "Test simple avec Node.js HTTP"
    });
    
    const receptionOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/navires/reception',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(receptionData)
        }
    };
    
    const receptionReq = http.request(receptionOptions, (res) => {
        console.log(`Status réception: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\nRéponse réception:');
            try {
                const jsonData = JSON.parse(data);
                console.log(JSON.stringify(jsonData, null, 2));
                
                if (jsonData.success) {
                    console.log('\n🎉 Réception créée avec succès!');
                    console.log('Navire ID:', jsonData.data.id);
                } else {
                    console.log('\n❌ Échec création réception:', jsonData.error);
                }
            } catch (error) {
                console.log('Réponse brute:', data);
                console.error('Erreur parsing JSON:', error);
            }
        });
    });
    
    receptionReq.on('error', (error) => {
        console.error('Erreur requête réception:', error);
    });
    
    receptionReq.write(receptionData);
    receptionReq.end();
}