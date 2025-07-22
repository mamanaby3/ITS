const bcrypt = require('bcrypt');

// Générer les hash pour le mot de passe "123456"
async function generatePasswordHashes() {
    const password = '123456';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Hash pour le mot de passe "123456":');
        console.log(hash);
        console.log('\n');
        
        // Générer le SQL UPDATE avec le vrai hash
        const users = [
            { email: 'manager@its.sn', nom: 'DIALLO', prenom: 'Mamadou' },
            { email: 'magasin1@its.sn', nom: 'NDIAYE', prenom: 'Oumar' },
            { email: 'magasin2@its.sn', nom: 'FALL', prenom: 'Amadou' },
            { email: 'magasin3@its.sn', nom: 'SECK', prenom: 'Ibrahima' },
            { email: 'magasin4@its.sn', nom: 'DIOP', prenom: 'Cheikh' },
            { email: 'magasin5@its.sn', nom: 'BA', prenom: 'Moussa' },
            { email: 'magasin6@its.sn', nom: 'SOW', prenom: 'Abdoulaye' },
            { email: 'magasin7@its.sn', nom: 'SARR', prenom: 'Modou' }
        ];
        
        console.log('-- Mettre à jour les mots de passe dans la base de données:');
        console.log('-- Copier ces commandes SQL après avoir exécuté le script de création:\n');
        
        users.forEach(user => {
            console.log(`UPDATE utilisateurs SET password = '${hash}' WHERE email = '${user.email}';`);
        });
        
        console.log('\n-- Ou utiliser cette commande pour tous les utilisateurs:');
        console.log(`UPDATE utilisateurs SET password = '${hash}';`);
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Test de vérification
async function testPassword() {
    const password = '123456';
    const hash = '$2b$10$ZqX5ZjPCBfYfMzVgL8qVZ.cVqVzLdK.HGjPqhHqaFJmH5xMGbLfDu'; // Exemple de hash
    
    try {
        const match = await bcrypt.compare(password, hash);
        console.log('\n\nTest de vérification:');
        console.log('Mot de passe:', password);
        console.log('Hash:', hash);
        console.log('Correspondance:', match);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécuter
generatePasswordHashes();
// testPassword();