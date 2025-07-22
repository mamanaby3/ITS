const mysql = require('mysql2/promise');
const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

// Credentials
const credentials = {
  manager: {
    email: 'admin@its-senegal.com',
    password: 'Admin123!'
  },
  operator: {
    email: 'operator.plateforme@its-senegal.com',
    password: 'operator123'
  }
};

// Pages et leurs endpoints API correspondants
const pagesEndpoints = {
  manager: [
    { 
      name: 'Tableau de Bord (Suivi Tonnage)', 
      url: '/suivi-tonnage',
      endpoints: ['/dashboard/tonnage', '/mouvements/recent', '/stocks/summary'],
      dbTables: ['mouvements_stock', 'stocks', 'magasins', 'produits']
    },
    { 
      name: 'Réception Navires', 
      url: '/reception-navires',
      endpoints: ['/navires', '/navires/recent'],
      dbTables: ['navires', 'navire_cargaison', 'produits']
    },
    { 
      name: 'Dispatching', 
      url: '/dispatching',
      endpoints: ['/navire-dispatching', '/navire-dispatching/pending'],
      dbTables: ['navire_dispatching', 'navires', 'magasins', 'clients']
    },
    { 
      name: 'Stock Magasins', 
      url: '/gestion-tonnage',
      endpoints: ['/stocks', '/stocks/by-magasin'],
      dbTables: ['stocks', 'magasins', 'produits']
    },
    { 
      name: 'Mouvements Stock', 
      url: '/mouvements',
      endpoints: ['/mouvements', '/mouvements/stats'],
      dbTables: ['mouvements_stock', 'produits', 'magasins']
    },
    { 
      name: 'Clients', 
      url: '/clients',
      endpoints: ['/clients'],
      dbTables: ['clients', 'commandes']
    },
    { 
      name: 'Produits', 
      url: '/produits',
      endpoints: ['/produits'],
      dbTables: ['produits', 'stocks']
    },
    { 
      name: 'Rapport Écarts', 
      url: '/comparaison-livraisons',
      endpoints: ['/rapports-dispatch/dispatch-vs-entrees'],
      dbTables: ['mouvements_stock', 'v_rapport_dispatch_entrees']
    }
  ],
  operator: [
    { 
      name: 'Tableau de Bord Magasinier', 
      url: '/magasinier-simple',
      endpoints: ['/dashboard/magasinier', '/stocks/my-stock'],
      dbTables: ['stocks', 'mouvements_stock', 'produits']
    },
    { 
      name: 'Enregistrer Entrées', 
      url: '/saisie-simple',
      endpoints: ['/stock/entree', '/produits', '/dispatches/pending'],
      dbTables: ['mouvements_stock', 'stocks', 'produits']
    },
    { 
      name: 'Mon Stock', 
      url: '/stock-simple',
      endpoints: ['/stocks/my-stock', '/stocks/movements'],
      dbTables: ['stocks', 'produits', 'mouvements_stock']
    },
    { 
      name: 'Tableau de Stock', 
      url: '/tableau-stock',
      endpoints: ['/stocks/detailed', '/stocks/alerts'],
      dbTables: ['stocks', 'produits', 'magasins']
    }
  ]
};

async function testDatabaseConnection() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'its_maritime_stock'
    });
    
    console.log('✅ Connexion à la base de données établie\n');
    
    // Vérifier les tables principales
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'its_maritime_stock']);
    
    const tableMap = {};
    tables.forEach(t => {
      tableMap[t.TABLE_NAME] = t.TABLE_ROWS || 0;
    });
    
    return { success: true, tables: tableMap };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (connection) await connection.end();
  }
}

async function login(role) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials[role]);
    return response.data.data.token;
  } catch (error) {
    console.error(`❌ Erreur de connexion ${role}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function testEndpoint(endpoint, token) {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
    
    // Vérifier si des données sont retournées
    const hasData = response.data && (
      (Array.isArray(response.data.data) && response.data.data.length > 0) ||
      (response.data.data && typeof response.data.data === 'object' && Object.keys(response.data.data).length > 0) ||
      response.data.success === true
    );
    
    return { 
      success: true, 
      hasData,
      dataCount: Array.isArray(response.data.data) ? response.data.data.length : null
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.status || error.code,
      message: error.response?.data?.message || error.message
    };
  }
}

async function testPagesDatabase() {
  console.log('🧪 TEST COMPLET DES PAGES AVEC BASE DE DONNÉES\n');
  
  // 1. Tester la connexion DB
  console.log('📊 VÉRIFICATION DE LA BASE DE DONNÉES\n');
  const dbTest = await testDatabaseConnection();
  
  if (!dbTest.success) {
    console.error('❌ Impossible de se connecter à la base de données:', dbTest.error);
    return;
  }
  
  console.log('Tables avec données:');
  Object.entries(dbTest.tables).forEach(([table, rows]) => {
    if (rows > 0) {
      console.log(`  ✅ ${table}: ${rows} lignes`);
    }
  });
  console.log('');
  
  // 2. Tester les pages Manager
  console.log('👔 TEST DES PAGES MANAGER\n');
  const managerToken = await login('manager');
  
  if (managerToken) {
    for (const page of pagesEndpoints.manager) {
      console.log(`\n📄 ${page.name}`);
      console.log(`URL: ${page.url}`);
      console.log(`Tables requises: ${page.dbTables.join(', ')}`);
      
      // Vérifier que les tables existent et ont des données
      const missingTables = page.dbTables.filter(table => !dbTest.tables[table]);
      const emptyTables = page.dbTables.filter(table => dbTest.tables[table] === 0);
      
      if (missingTables.length > 0) {
        console.log(`❌ Tables manquantes: ${missingTables.join(', ')}`);
      }
      if (emptyTables.length > 0) {
        console.log(`⚠️  Tables vides: ${emptyTables.join(', ')}`);
      }
      
      // Tester les endpoints
      console.log('Endpoints:');
      let allEndpointsOk = true;
      
      for (const endpoint of page.endpoints) {
        const result = await testEndpoint(endpoint, managerToken);
        if (result.success) {
          if (result.hasData) {
            console.log(`  ✅ ${endpoint} - OK (${result.dataCount || 'données'} trouvées)`);
          } else {
            console.log(`  ⚠️  ${endpoint} - OK mais aucune donnée`);
          }
        } else {
          console.log(`  ❌ ${endpoint} - Erreur ${result.error}: ${result.message}`);
          allEndpointsOk = false;
        }
      }
      
      // Statut global de la page
      if (allEndpointsOk && missingTables.length === 0) {
        console.log(`\n✅ Page fonctionnelle avec la DB`);
      } else {
        console.log(`\n❌ Page avec problèmes d'intégration DB`);
      }
    }
  }
  
  console.log('\n\n---\n');
  
  // 3. Tester les pages Magasinier
  console.log('👷 TEST DES PAGES MAGASINIER\n');
  const operatorToken = await login('operator');
  
  if (operatorToken) {
    for (const page of pagesEndpoints.operator) {
      console.log(`\n📄 ${page.name}`);
      console.log(`URL: ${page.url}`);
      console.log(`Tables requises: ${page.dbTables.join(', ')}`);
      
      // Vérifier que les tables existent et ont des données
      const missingTables = page.dbTables.filter(table => !dbTest.tables[table]);
      const emptyTables = page.dbTables.filter(table => dbTest.tables[table] === 0);
      
      if (missingTables.length > 0) {
        console.log(`❌ Tables manquantes: ${missingTables.join(', ')}`);
      }
      if (emptyTables.length > 0) {
        console.log(`⚠️  Tables vides: ${emptyTables.join(', ')}`);
      }
      
      // Tester les endpoints
      console.log('Endpoints:');
      let allEndpointsOk = true;
      
      for (const endpoint of page.endpoints) {
        const result = await testEndpoint(endpoint, operatorToken);
        if (result.success) {
          if (result.hasData) {
            console.log(`  ✅ ${endpoint} - OK (${result.dataCount || 'données'} trouvées)`);
          } else {
            console.log(`  ⚠️  ${endpoint} - OK mais aucune donnée`);
          }
        } else {
          console.log(`  ❌ ${endpoint} - Erreur ${result.error}: ${result.message}`);
          allEndpointsOk = false;
        }
      }
      
      // Statut global de la page
      if (allEndpointsOk && missingTables.length === 0) {
        console.log(`\n✅ Page fonctionnelle avec la DB`);
      } else {
        console.log(`\n❌ Page avec problèmes d'intégration DB`);
      }
    }
  }
  
  console.log('\n\n📊 RÉSUMÉ FINAL\n');
  console.log('Pour qu\'une page soit pleinement fonctionnelle, elle doit:');
  console.log('1. Avoir toutes ses tables DB créées');
  console.log('2. Avoir des données dans ces tables');
  console.log('3. Avoir des endpoints API qui répondent correctement');
  console.log('4. Retourner des données depuis la DB');
}

// Exécuter les tests
testPagesDatabase().catch(console.error);