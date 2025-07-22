require('dotenv').config();
const db = require('./config/database-mysql');

console.log('🔍 Test de connexion MySQL...\n');
console.log('Configuration:');
console.log('- Host:', process.env.DB_HOST || 'localhost');
console.log('- Port:', process.env.DB_PORT || 3306);
console.log('- Database:', process.env.DB_NAME || 'its_maritime_stock');
console.log('- User:', process.env.DB_USER || 'root');
console.log('- Password:', process.env.DB_PASSWORD ? '***' : '(vide)');

async function testConnection() {
    try {
        console.log('\n⏳ Tentative de connexion...');
        
        // Test simple
        const [result] = await db.execute('SELECT 1 as test');
        console.log('✅ Connexion MySQL réussie!');
        
        // Test des tables
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ?
        `, [process.env.DB_NAME || 'its_maritime_stock']);
        
        console.log(`\n📊 Tables trouvées (${tables.length}):`);
        tables.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        // Test table utilisateurs
        const [users] = await db.execute('SELECT COUNT(*) as count FROM utilisateurs');
        console.log(`\n👥 Utilisateurs: ${users[0].count}`);
        
        // Test table navires
        const [navires] = await db.execute('SELECT COUNT(*) as count FROM navires');
        console.log(`🚢 Navires: ${navires[0].count}`);
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur de connexion:', error.message);
        console.error('\nDétails:', error);
        process.exit(1);
    }
}

testConnection();