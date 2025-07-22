const { pool } = require('../config/database-mysql');

async function assignMagasinsToOperators() {
  try {
    console.log('=== ASSIGNATION DES MAGASINS AUX OPÉRATEURS ===\n');

    // Mapping des opérateurs aux magasins basé sur leur email
    const operatorMagasinMapping = {
      'operator.belair@its-senegal.com': 'belair-garage',
      'operator.km16@its-senegal.com': 'km16-thiaroye',
      'operator.plateforme@its-senegal.com': 'plateforme-belair', // Déjà assigné
      'operator.rufisque@its-senegal.com': 'rufisque',
      'operator.sips@its-senegal.com': 'sips-pikine',
      'operator.thiaroye@its-senegal.com': 'thiaroye-km14',
      'operator.yarakh@its-senegal.com': 'yarakh'
    };

    for (const [email, magasinId] of Object.entries(operatorMagasinMapping)) {
      try {
        const [result] = await pool.execute(
          'UPDATE utilisateurs SET magasin_id = ? WHERE email = ?',
          [magasinId, email]
        );
        
        if (result.affectedRows > 0) {
          console.log(`✅ ${email} -> ${magasinId}`);
        } else {
          console.log(`⚠️  ${email} non trouvé`);
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${email}:`, error.message);
      }
    }

    // Vérifier les mises à jour
    console.log('\n=== VÉRIFICATION DES ASSIGNATIONS ===');
    const [users] = await pool.query(`
      SELECT 
        u.email,
        u.magasin_id,
        m.nom as magasin_nom
      FROM utilisateurs u
      LEFT JOIN magasins m ON u.magasin_id = m.id
      WHERE u.role = 'operator'
      ORDER BY u.email
    `);

    users.forEach(user => {
      console.log(`${user.email}: ${user.magasin_id} (${user.magasin_nom || 'N/A'})`);
    });

    console.log('\n✅ Assignation terminée!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

assignMagasinsToOperators();