// Script de test pour l'API livraisons
const db = require('../config/database-mysql');

async function testLivraisonsAPI() {
  console.log('=== TEST API LIVRAISONS ===\n');
  
  try {
    // 1. Vérifier la connexion à la base de données
    console.log('1. Test connexion base de données...');
    const [testConnection] = await db.execute('SELECT 1 as test');
    console.log('✅ Connexion OK\n');
    
    // 2. Vérifier que la table livraisons existe
    console.log('2. Vérification table livraisons...');
    const [tables] = await db.execute("SHOW TABLES LIKE 'livraisons'");
    
    if (tables.length === 0) {
      console.log('❌ Table livraisons n\'existe pas!');
      console.log('Exécutez: mysql -u root its_maritime_stock < backend/scripts/create-livraisons-table.sql\n');
      return;
    }
    console.log('✅ Table livraisons existe\n');
    
    // 3. Vérifier la structure de la table
    console.log('3. Structure de la table livraisons:');
    const [columns] = await db.execute('DESCRIBE livraisons');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key
    })));
    
    // 4. Tester une insertion simple
    console.log('\n4. Test d\'insertion...');
    const testData = {
      produit_id: 1,
      quantite: 10.5,
      date_livraison: new Date().toISOString().split('T')[0],
      transporteur: 'Test Transport',
      numero_camion: 'TEST-123',
      chauffeur: 'Test Chauffeur',
      statut: 'livre'
    };
    
    try {
      const [result] = await db.execute(`
        INSERT INTO livraisons (
          produit_id, quantite, date_livraison, 
          transporteur, numero_camion, chauffeur, statut
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        testData.produit_id,
        testData.quantite,
        testData.date_livraison,
        testData.transporteur,
        testData.numero_camion,
        testData.chauffeur,
        testData.statut
      ]);
      
      console.log('✅ Insertion réussie, ID:', result.insertId);
      
      // Supprimer l'enregistrement de test
      await db.execute('DELETE FROM livraisons WHERE id = ?', [result.insertId]);
      console.log('✅ Enregistrement de test supprimé\n');
      
    } catch (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
      
      // Vérifier si c'est un problème de clé étrangère
      if (insertError.message.includes('foreign key')) {
        console.log('\n⚠️  Problème de clé étrangère détecté!');
        console.log('Vérifiez que:');
        console.log('- Le produit avec ID 1 existe dans la table produits');
        console.log('- Les tables clients et magasins existent si référencées\n');
        
        // Lister les produits existants
        const [produits] = await db.execute('SELECT id, nom FROM produits LIMIT 5');
        if (produits.length > 0) {
          console.log('Produits disponibles:');
          console.table(produits);
        } else {
          console.log('❌ Aucun produit dans la base!');
        }
      }
    }
    
    // 5. Vérifier le contrôleur
    console.log('\n5. Vérification du contrôleur...');
    const fs = require('fs');
    const controllerPath = '../controllers/livraisonController-mysql.js';
    if (fs.existsSync(__dirname + '/' + controllerPath)) {
      console.log('✅ Contrôleur MySQL existe');
    } else {
      console.log('❌ Contrôleur MySQL manquant!');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error(error);
  } finally {
    process.exit();
  }
}

testLivraisonsAPI();