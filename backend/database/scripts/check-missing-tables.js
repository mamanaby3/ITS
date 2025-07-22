const schemaTables = [
  'magasins', 'utilisateurs', 'produits', 'stocks', 'clients',
  'commandes', 'commande_details', 'mouvements_stock', 'livraisons',
  'navires', 'navire_cargaison', 'navire_dispatching'
];

const existingTables = [
  'magasins', 'navire_cargaison', 'navire_dispatching', 
  'navires', 'produits', 'users', 'utilisateurs',
  'v_mouvements_details', 'v_stock_global'
];

console.log('=== ANALYSE DES TABLES ===\n');

console.log('Tables MANQUANTES dans la base:');
schemaTables.forEach(table => {
  if (!existingTables.includes(table)) {
    console.log('❌ ' + table);
  }
});

console.log('\nTables EXISTANTES:');
schemaTables.forEach(table => {
  if (existingTables.includes(table)) {
    console.log('✅ ' + table);
  }
});

console.log('\nTables en TROP (pas dans le schéma):');
existingTables.forEach(table => {
  if (!schemaTables.includes(table) && !table.startsWith('v_')) {
    console.log('⚠️  ' + table);
  }
});