const mysql = require('mysql2');
require('dotenv').config();

console.log('🔍 Test des credentials MySQL...\n');

// Afficher la configuration actuelle
console.log('📋 Configuration actuelle:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || 3306);
console.log('  User:', process.env.DB_USER || 'root');
console.log('  Password:', process.env.DB_PASSWORD ? '***' : '(vide)');
console.log('  Database:', process.env.DB_NAME || 'its_maritime_stock');
console.log('');

async function testConnection() {
    console.log('⏳ Test de connexion MySQL...');
    
    // Configuration de connexion
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
    };
    
    let connection;
    
    try {
        // 1. Test de connexion sans spécifier de base
        console.log('1️⃣ Test connexion au serveur MySQL...');
        connection = mysql.createConnection(config);
        
        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('✅ Connexion au serveur MySQL réussie!');
        
        // 2. Lister les bases de données disponibles
        console.log('\n2️⃣ Bases de données disponibles:');
        const [databases] = await connection.promise().query('SHOW DATABASES');
        databases.forEach(db => {
            console.log(`   - ${db.Database}`);
        });
        
        // 3. Vérifier si notre base existe
        const targetDb = process.env.DB_NAME || 'its_maritime_stock';
        const dbExists = databases.some(db => db.Database === targetDb);
        
        if (dbExists) {
            console.log(`\n✅ Base de données '${targetDb}' trouvée!`);
            
            // 4. Se connecter à la base et lister les tables
            console.log('\n3️⃣ Test connexion à la base spécifique...');
            await connection.promise().query(`USE ${targetDb}`);
            
            const [tables] = await connection.promise().query('SHOW TABLES');
            console.log(`\n📊 Tables dans '${targetDb}' (${tables.length}):`);
            tables.forEach(table => {
                const tableName = table[`Tables_in_${targetDb}`];
                console.log(`   - ${tableName}`);
            });
            
            // 5. Test requête sur table utilisateurs
            console.log('\n4️⃣ Test requête sur table utilisateurs...');
            try {
                const [users] = await connection.promise().query('SELECT COUNT(*) as count FROM utilisateurs');
                console.log(`✅ Utilisateurs trouvés: ${users[0].count}`);
                
                // Afficher les utilisateurs existants
                const [userList] = await connection.promise().query('SELECT id, email, role FROM utilisateurs LIMIT 5');
                console.log('\n👥 Utilisateurs existants:');
                userList.forEach(user => {
                    console.log(`   - ${user.email} (${user.role})`);
                });
                
            } catch (tableError) {
                console.error('❌ Erreur accès table utilisateurs:', tableError.message);
                console.log('\n💡 La table utilisateurs n\'existe pas ou n\'est pas accessible');
                console.log('   Vous devez peut-être exécuter le script de création de la base.');
            }
            
        } else {
            console.error(`\n❌ Base de données '${targetDb}' NON TROUVÉE!`);
            console.log('\n💡 Solutions possibles:');
            console.log('   1. Créer la base de données manuellement dans phpMyAdmin');
            console.log('   2. Exécuter le script SQL: database-maritime-schema.sql');
            console.log('   3. Vérifier le nom de la base dans le fichier .env');
        }
        
    } catch (error) {
        console.error('\n❌ Erreur de connexion MySQL:');
        console.error('   Type:', error.code);
        console.error('   Message:', error.message);
        
        console.log('\n🔧 Diagnostic:');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('   ❌ MySQL n\'est pas démarré ou n\'écoute pas sur le port 3306');
            console.log('   💡 Solutions:');
            console.log('      - Démarrer MySQL dans XAMPP');
            console.log('      - Vérifier que le port 3306 n\'est pas bloqué');
            console.log('      - Vérifier que MySQL écoute sur localhost');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('   ❌ Accès refusé - mauvais identifiants');
            console.log('   💡 Solutions:');
            console.log('      - Vérifier le nom d\'utilisateur et mot de passe');
            console.log('      - Dans XAMPP, l\'utilisateur par défaut est "root" sans mot de passe');
            console.log('      - Vérifier la configuration dans phpMyAdmin');
        } else if (error.code === 'ENOTFOUND') {
            console.log('   ❌ Serveur non trouvé');
            console.log('   💡 Solutions:');
            console.log('      - Vérifier l\'adresse du serveur (localhost)');
            console.log('      - Vérifier la configuration réseau');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   ❌ Timeout de connexion');
            console.log('   💡 Solutions:');
            console.log('      - MySQL met trop de temps à répondre');
            console.log('      - Vérifier les performances du système');
            console.log('      - Redémarrer MySQL');
        }
        
        console.log('\n🔍 Vérifications à faire:');
        console.log('   1. XAMPP Control Panel: MySQL démarré (vert)');
        console.log('   2. phpMyAdmin accessible: http://localhost/phpmyadmin');
        console.log('   3. Port 3306 libre: netstat -an | findstr 3306');
        console.log('   4. Fichier .env correct dans /backend/');
        
    } finally {
        if (connection) {
            connection.end();
            console.log('\n🔌 Connexion fermée');
        }
    }
}

// Options en ligne de commande
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node test-credentials.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Afficher cette aide');
    console.log('  --create-db    Créer la base de données si elle n\'existe pas');
    process.exit(0);
}

if (args.includes('--create-db')) {
    console.log('🔨 Mode création de base de données activé\n');
}

testConnection();