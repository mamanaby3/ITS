#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DB_CHECK_URL = `http://localhost:${PORT}/api/health`;

console.log('🚀 Démarrage du serveur ITS Maritime Stock...\n');

async function checkDatabase() {
    console.log('🔍 Test de connexion à la base de données...');
    
    try {
        const testConnection = require('./test-connection');
        console.log('✅ Connexion MySQL testée avec succès!\n');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        console.error('\n💡 Suggestions:');
        console.error('   1. Vérifiez que XAMPP MySQL est démarré');
        console.error('   2. Vérifiez les identifiants dans .env');
        console.error('   3. Assurez-vous que la base "its_maritime_stock" existe\n');
        return false;
    }
}

async function waitForServer() {
    console.log('⏳ Attente du démarrage du serveur...');
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(DB_CHECK_URL, { timeout: 2000 });
            if (response.data.status === 'OK') {
                console.log('✅ Serveur démarré et opérationnel!');
                console.log('📊 Status:', response.data.status);
                console.log('🗄️  Base de données:', response.data.database);
                return true;
            }
        } catch (error) {
            // Serveur pas encore prêt
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error('❌ Le serveur n\'a pas pu démarrer dans les temps impartis');
    return false;
}

async function testEndpoints() {
    console.log('\n🧪 Test des endpoints principaux...');
    
    const endpoints = [
        { url: `http://localhost:${PORT}/api`, name: 'API Base' },
        { url: `http://localhost:${PORT}/api/health`, name: 'Health Check' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint.url, { timeout: 5000 });
            console.log(`✅ ${endpoint.name}: OK`);
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
}

async function startServer() {
    // 1. Vérifier la base de données
    const dbOk = await checkDatabase();
    if (!dbOk) {
        process.exit(1);
    }
    
    // 2. Démarrer le serveur
    console.log('🚀 Lancement du serveur Express...');
    const serverProcess = spawn('node', ['server-mysql.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // 3. Attendre que le serveur soit prêt
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const serverReady = await waitForServer();
    if (!serverReady) {
        serverProcess.kill();
        process.exit(1);
    }
    
    // 4. Tester les endpoints
    await testEndpoints();
    
    console.log('\n🎉 Serveur ITS Maritime Stock démarré avec succès!');
    console.log('═══════════════════════════════════════════════');
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n📝 Endpoints disponibles:');
    console.log('   🔐 Auth:        /api/auth');
    console.log('   🚢 Navires:     /api/navires');
    console.log('   👥 Users:       /api/users');
    console.log('   📦 Produits:    /api/produits');
    console.log('   📊 Stock:       /api/stock');
    console.log('   👤 Clients:     /api/clients');
    console.log('   📋 Commandes:   /api/commandes');
    console.log('   🚚 Livraisons:  /api/livraisons');
    console.log('   📈 Rapports:    /api/rapports');
    console.log('\n🛑 Pour arrêter le serveur: Ctrl+C');
    
    // Gérer l'arrêt propre
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Arrêt du serveur en cours...');
        serverProcess.kill();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n\n🛑 Arrêt du serveur en cours...');
        serverProcess.kill();
        process.exit(0);
    });
}

// Lancer le processus
startServer().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});