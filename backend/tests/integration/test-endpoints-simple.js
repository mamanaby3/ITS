const http = require('http');

// Test direct sans authentification pour vérifier si le serveur répond
const testHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Health check error:', error);
  });

  req.end();
};

// Test login avec les bonnes données
const testLogin = () => {
  const postData = JSON.stringify({
    email: 'admin@its-senegal.com',
    password: 'Admin123!'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nLogin status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Login response:', data);
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.success && parsed.token) {
          testMagasins(parsed.token);
        } else if (parsed.data && parsed.data.token) {
          testMagasins(parsed.data.token);
        }
      } catch (e) {
        console.error('Failed to parse login response');
      }
    });
  });

  req.on('error', (error) => {
    console.error('Login error:', error);
  });

  req.write(postData);
  req.end();
};

// Test magasins endpoint
const testMagasins = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/magasins',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nMagasins status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Magasins response:', data.substring(0, 200) + '...');
      
      // Test mouvements aussi
      testMouvements(token);
    });
  });

  req.on('error', (error) => {
    console.error('Magasins error:', error);
  });

  req.end();
};

// Test mouvements endpoint
const testMouvements = (token) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/mouvements?date_debut=2025-01-01&date_fin=2025-12-31&limit=10',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nMouvements status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Mouvements response:', data.substring(0, 200) + '...');
    });
  });

  req.on('error', (error) => {
    console.error('Mouvements error:', error);
  });

  req.end();
};

// Démarrer les tests
console.log('Starting API tests...\n');
testHealth();
setTimeout(testLogin, 1000);