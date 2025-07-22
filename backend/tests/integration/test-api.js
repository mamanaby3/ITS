const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API Backend ITS Sénégal\n');

    // 1. Test de connexion
    console.log('1. Test de connexion...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@its-senegal.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Connexion réussie');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      console.log(`   Utilisateur: ${loginResponse.data.data.user.nom} ${loginResponse.data.data.user.prenom}`);
      console.log(`   Rôle: ${loginResponse.data.data.user.role}\n`);
    }

    // Configuration axios avec le token
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // 2. Test récupération des produits
    console.log('2. Test récupération des produits...');
    const produitsResponse = await authAxios.get('/produits');
    console.log(`✅ ${produitsResponse.data.data.length} produits récupérés`);
    produitsResponse.data.data.slice(0, 3).forEach(p => {
      console.log(`   - ${p.reference}: ${p.nom} (${p.prix_unitaire} FCFA/${p.unite})`);
    });
    console.log();

    // 3. Test récupération des clients
    console.log('3. Test récupération des clients...');
    const clientsResponse = await authAxios.get('/clients');
    console.log(`✅ ${clientsResponse.data.data.length} clients récupérés`);
    clientsResponse.data.data.forEach(c => {
      console.log(`   - ${c.code}: ${c.nom} (${c.ville})`);
    });
    console.log();

    // 4. Test création d'un produit
    console.log('4. Test création d\'un produit...');
    const nouveauProduit = await authAxios.post('/produits', {
      reference: 'TEST-001',
      nom: 'Produit de test',
      description: 'Produit créé pour tester l\'API',
      categorie: 'Test',
      unite: 'Pièce',
      prix_unitaire: 1000,
      seuil_alerte: 10
    });
    console.log('✅ Produit créé avec succès');
    console.log(`   ID: ${nouveauProduit.data.data.id}`);
    console.log(`   Référence: ${nouveauProduit.data.data.reference}\n`);

    // 5. Test récupération du stock
    console.log('5. Test récupération du stock pour Dakar Port...');
    const stockResponse = await authAxios.get('/stock/magasin/dkr-port');
    console.log(`✅ ${stockResponse.data.data.length} articles en stock`);
    console.log();

    // 6. Test ajout de stock
    console.log('6. Test ajout de stock...');
    const ajoutStock = await authAxios.post('/stock/entree', {
      produit_id: nouveauProduit.data.data.id,
      magasin_id: 'dkr-port',
      quantite: 100,
      lot_number: 'LOT-TEST-001',
      fournisseur: 'Fournisseur Test'
    });
    console.log('✅ Stock ajouté avec succès');
    console.log(`   Quantité: ${ajoutStock.data.data.quantite}`);
    console.log(`   Lot: ${ajoutStock.data.data.lot_number}\n`);

    // 7. Test création d'un client
    console.log('7. Test création d\'un client...');
    const nouveauClient = await authAxios.post('/clients', {
      code: 'CLI-TEST',
      nom: 'Client Test API',
      email: 'test@api.com',
      telephone: '+221 77 123 45 67',
      adresse: '123 Rue Test',
      ville: 'Dakar',
      type_client: 'entreprise',
      credit_limit: 1000000,
      magasin_id: 'dkr-port'
    });
    console.log('✅ Client créé avec succès');
    console.log(`   Code: ${nouveauClient.data.data.code}`);
    console.log(`   Limite crédit: ${nouveauClient.data.data.credit_limit} FCFA\n`);

    // 8. Test création d'une commande
    console.log('8. Test création d\'une commande...');
    const nouvelleCommande = await authAxios.post('/commandes', {
      client_id: nouveauClient.data.data.id,
      magasin_id: 'dkr-port',
      date_livraison_prevue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Commande de test API',
      details: [{
        produit_id: nouveauProduit.data.data.id,
        quantite: 10
      }]
    });
    console.log('✅ Commande créée avec succès');
    console.log(`   Numéro: ${nouvelleCommande.data.data.numero}`);
    console.log(`   Montant TTC: ${nouvelleCommande.data.data.total_ttc} FCFA`);
    console.log(`   Statut: ${nouvelleCommande.data.data.statut}\n`);

    // 9. Test rapports
    console.log('9. Test récupération rapport de stock...');
    const rapportStock = await authAxios.get('/rapports/stock?magasin_id=dkr-port');
    console.log('✅ Rapport généré avec succès');
    console.log(`   Total produits: ${rapportStock.data.data.summary.total_produits}`);
    console.log(`   Valeur totale: ${rapportStock.data.data.summary.valeur_totale} FCFA`);
    console.log(`   Produits en alerte: ${rapportStock.data.data.summary.produits_en_alerte}\n`);

    console.log('🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Lancer les tests
testAPI();