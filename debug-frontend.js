// Script de debug pour vérifier la configuration frontend
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Debug de la configuration frontend...\n');

// 1. Vérifier le fichier .env
try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
    console.log('📁 Fichier .env trouvé:');
    console.log(envContent);
    console.log('');
} catch (error) {
    console.log('❌ Fichier .env non trouvé');
}

// 2. Vérifier les variables d'environnement dans constants.js
try {
    const constantsContent = readFileSync(join(__dirname, 'src/utils/constants.js'), 'utf8');
    
    // Extraire les lignes importantes
    const lines = constantsContent.split('\n');
    const apiLines = lines.filter(line => 
        line.includes('API_BASE_URL') || 
        line.includes('USE_MOCK_API') || 
        line.includes('VITE_')
    );
    
    console.log('📋 Configuration API dans constants.js:');
    apiLines.forEach(line => console.log('  ', line.trim()));
    console.log('');
} catch (error) {
    console.log('❌ Erreur lecture constants.js:', error.message);
}

// 3. Vérifier le service API
try {
    const apiServiceContent = readFileSync(join(__dirname, 'src/services/api.js'), 'utf8');
    
    // Chercher les lignes importantes
    const lines = apiServiceContent.split('\n');
    const importLines = lines.filter(line => line.includes('USE_MOCK_API'));
    const mockApiLines = lines.filter((line, index) => {
        if (line.includes('USE_MOCK_API') || line.includes('mockAPI')) {
            return true;
        }
        // Prendre quelques lignes autour
        if (index > 0 && lines[index-1].includes('USE_MOCK_API')) return true;
        if (index < lines.length-1 && lines[index+1].includes('USE_MOCK_API')) return true;
        return false;
    });
    
    console.log('🔧 Configuration mockAPI dans api.js:');
    mockApiLines.forEach((line, i) => {
        console.log(`  ${i+1}: ${line.trim()}`);
    });
    console.log('');
} catch (error) {
    console.log('❌ Erreur lecture api.js:', error.message);
}

console.log('✅ Debug terminé');
console.log('');
console.log('🎯 Pour tester la connexion frontend-backend:');
console.log('   Ouvrir: test-frontend-api.html dans un navigateur');
console.log('   Ou redémarrer le frontend: npm run dev');