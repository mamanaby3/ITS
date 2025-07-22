const bcrypt = require('bcryptjs');

// Fonction pour hasher un mot de passe
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Erreur lors du hashage:', error);
    throw error;
  }
}

// Script principal
async function main() {
  // Mot de passe par défaut pour le manager
  const defaultPassword = 'Manager123!';
  
  console.log('=== Générateur de Hash de Mot de Passe ===\n');
  console.log(`Mot de passe: ${defaultPassword}`);
  
  try {
    const hash = await hashPassword(defaultPassword);
    console.log(`\nHash généré:\n${hash}`);
    
    console.log('\n--- Instructions SQL ---');
    console.log(`
UPDATE utilisateurs 
SET password = '${hash}' 
WHERE email = 'manager@its-senegal.com';

-- Ou pour créer un nouvel utilisateur:
INSERT INTO utilisateurs (email, password, nom, prenom, role, magasin_id, actif) 
VALUES (
  'manager@its-senegal.com',
  '${hash}',
  'DIALLO',
  'Mamadou',
  'manager',
  NULL,
  1
);
    `);
    
    // Tester le hash
    const isValid = await bcrypt.compare(defaultPassword, hash);
    console.log(`\nTest de vérification: ${isValid ? '✅ Succès' : '❌ Échec'}`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { hashPassword };