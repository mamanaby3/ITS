const { pool } = require('../config/database-mysql');

async function checkUserMagasin() {
  try {
    // Vérifier les utilisateurs et leurs magasins
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.magasin_id,
        m.nom as magasin_nom
      FROM utilisateurs u
      LEFT JOIN magasins m ON u.magasin_id = m.id
      WHERE u.role IN ('operator', 'manager')
      ORDER BY u.role, u.email
    `);

    console.log('\n=== UTILISATEURS ET LEURS MAGASINS ===');
    users.forEach(user => {
      console.log(`${user.email} (${user.role})`);
      console.log(`  Magasin: ${user.magasin_id || 'NON ASSIGNÉ'} - ${user.magasin_nom || 'N/A'}`);
      console.log('');
    });

    // Vérifier les magasins disponibles
    const [magasins] = await pool.query('SELECT id, nom FROM magasins');
    console.log('\n=== MAGASINS DISPONIBLES ===');
    magasins.forEach(mag => {
      console.log(`- ${mag.id}: ${mag.nom}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkUserMagasin();