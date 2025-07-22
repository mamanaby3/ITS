const { exec } = require('child_process');
const net = require('net');
const http = require('http');

console.log('🔍 Vérification de l\'état de XAMPP...\n');

// Fonction pour tester si un port est ouvert
function testPort(port, host = 'localhost') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

// Fonction pour tester une URL HTTP
function testHTTP(url) {
    return new Promise((resolve) => {
        const request = http.get(url, { timeout: 3000 }, (response) => {
            resolve(response.statusCode >= 200 && response.statusCode < 400);
        });
        
        request.on('error', () => resolve(false));
        request.on('timeout', () => {
            request.abort();
            resolve(false);
        });
    });
}

async function checkXAMPP() {
    console.log('1️⃣ Vérification des ports XAMPP...');
    
    // Ports XAMPP standards
    const ports = [
        { name: 'Apache HTTP', port: 80, service: 'apache' },
        { name: 'Apache HTTPS', port: 443, service: 'apache' },
        { name: 'MySQL', port: 3306, service: 'mysql' },
        { name: 'phpMyAdmin', port: 80, service: 'phpmyadmin', url: 'http://localhost/phpmyadmin' }
    ];
    
    for (const portInfo of ports) {
        const isOpen = await testPort(portInfo.port);
        const status = isOpen ? '✅' : '❌';
        console.log(`   ${status} ${portInfo.name} (port ${portInfo.port}): ${isOpen ? 'OUVERT' : 'FERMÉ'}`);
    }
    
    console.log('\n2️⃣ Test d\'accès aux services web...');
    
    // Test Apache
    const apacheOk = await testHTTP('http://localhost');
    console.log(`   ${apacheOk ? '✅' : '❌'} Apache: ${apacheOk ? 'ACCESSIBLE' : 'NON ACCESSIBLE'}`);
    
    // Test phpMyAdmin
    const phpMyAdminOk = await testHTTP('http://localhost/phpmyadmin');
    console.log(`   ${phpMyAdminOk ? '✅' : '❌'} phpMyAdmin: ${phpMyAdminOk ? 'ACCESSIBLE' : 'NON ACCESSIBLE'}`);
    
    console.log('\n3️⃣ Processus XAMPP en cours...');
    
    // Vérifier les processus Windows
    exec('tasklist /fi "imagename eq httpd.exe" /fo csv', (error, stdout) => {
        if (stdout.includes('httpd.exe')) {
            console.log('   ✅ Apache (httpd.exe) en cours d\'exécution');
        } else {
            console.log('   ❌ Apache (httpd.exe) non trouvé');
        }
    });
    
    exec('tasklist /fi "imagename eq mysqld.exe" /fo csv', (error, stdout) => {
        if (stdout.includes('mysqld.exe')) {
            console.log('   ✅ MySQL (mysqld.exe) en cours d\'exécution');
        } else {
            console.log('   ❌ MySQL (mysqld.exe) non trouvé');
        }
    });
    
    // Attendre un peu pour les processus
    setTimeout(() => {
        console.log('\n4️⃣ Diagnostic et recommandations...');
        
        const mysqlPort = testPort(3306);
        mysqlPort.then(isOpen => {
            if (!isOpen) {
                console.log('\n🔴 MySQL n\'est pas accessible!');
                console.log('\n💡 Solutions à essayer:');
                console.log('   1. Ouvrir XAMPP Control Panel');
                console.log('   2. Cliquer sur "Start" pour MySQL');
                console.log('   3. Vérifier que le bouton devient vert');
                console.log('   4. Si erreur, vérifier les logs XAMPP');
                console.log('   5. Redémarrer XAMPP en tant qu\'administrateur');
                console.log('\n📍 Emplacements XAMPP typiques:');
                console.log('   - C:\\xampp\\xampp-control.exe');
                console.log('   - C:\\Program Files\\XAMPP\\xampp-control.exe');
                console.log('\n🔧 Dépannage avancé:');
                console.log('   - Logs MySQL: C:\\xampp\\mysql\\data\\');
                console.log('   - Config MySQL: C:\\xampp\\mysql\\bin\\my.ini');
                console.log('   - Port en conflit: netstat -an | findstr 3306');
            } else {
                console.log('\n✅ MySQL semble accessible!');
                console.log('\n🔍 Si vous avez encore des erreurs de connexion:');
                console.log('   1. Vérifier les credentials: node test-credentials.js');
                console.log('   2. Créer la base de données si nécessaire');
                console.log('   3. Importer le schéma database-maritime-schema.sql');
            }
        });
        
    }, 2000);
}

// Fonction pour afficher l'aide
function showHelp() {
    console.log('Usage: node check-xampp.js [options]');
    console.log('');
    console.log('Ce script vérifie l\'état des services XAMPP nécessaires');
    console.log('pour faire fonctionner l\'application ITS Maritime Stock.');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Afficher cette aide');
    console.log('');
    console.log('Services vérifiés:');
    console.log('  - Apache (ports 80, 443)');
    console.log('  - MySQL (port 3306)');
    console.log('  - phpMyAdmin (via HTTP)');
    console.log('');
    console.log('Exemples:');
    console.log('  node check-xampp.js           # Vérification complète');
}

// Gestion des arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

// Lancer la vérification
checkXAMPP();