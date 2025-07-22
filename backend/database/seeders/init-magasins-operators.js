const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Magasin = require('./models/Magasin');

async function initMagasinsAndOperators() {
  try {
    console.log('🔄 Initialisation des magasins et opérateurs...');
    
    // Synchroniser les tables
    await Magasin.sync();
    await User.sync();
    
    // Créer les 7 magasins
    const magasins = [
      { 
        id: 'DKR-PORT', 
        nom: 'Port de Dakar', 
        ville: 'Dakar',
        zone: 'Dakar',
        adresse: 'Port Autonome de Dakar'
      },
      { 
        id: 'DKR-IND', 
        nom: 'Zone Industrielle Dakar', 
        ville: 'Dakar',
        zone: 'Dakar',
        adresse: 'Zone Industrielle'
      },
      { 
        id: 'THIES', 
        nom: 'Thiès', 
        ville: 'Thiès',
        zone: 'Thiès',
        adresse: 'Centre ville Thiès'
      },
      { 
        id: 'STL', 
        nom: 'Saint-Louis', 
        ville: 'Saint-Louis',
        zone: 'Saint-Louis',
        adresse: 'Centre ville Saint-Louis'
      },
      { 
        id: 'KAOL', 
        nom: 'Kaolack', 
        ville: 'Kaolack',
        zone: 'Kaolack',
        adresse: 'Centre ville Kaolack'
      },
      { 
        id: 'ZIGUI', 
        nom: 'Ziguinchor', 
        ville: 'Ziguinchor',
        zone: 'Ziguinchor',
        adresse: 'Centre ville Ziguinchor'
      },
      { 
        id: 'TAMB', 
        nom: 'Tambacounda', 
        ville: 'Tambacounda',
        zone: 'Tambacounda',
        adresse: 'Centre ville Tambacounda'
      }
    ];
    
    // Créer les magasins
    for (const magasinData of magasins) {
      try {
        const [magasin, created] = await Magasin.findOrCreate({
          where: { id: magasinData.id },
          defaults: magasinData
        });
        
        if (created) {
          console.log(`✅ Magasin créé: ${magasinData.nom}`);
        } else {
          console.log(`⚠️  Magasin existe déjà: ${magasinData.nom}`);
        }
        
        // Créer l'opérateur pour ce magasin
        const operatorData = {
          email: `operator.${magasinData.id.toLowerCase()}@its-sn.com`,
          password: 'operator123',
          nom: `Chef ${magasinData.nom}`,
          prenom: 'Opérateur',
          role: 'operator',
          magasinId: magasin.id,
          actif: true
        };
        
        const existing = await User.findOne({ where: { email: operatorData.email } });
        
        if (!existing) {
          const hashedPassword = await bcrypt.hash(operatorData.password, 10);
          await User.create({
            ...operatorData,
            password: hashedPassword
          });
          console.log(`✅ Opérateur créé: ${operatorData.email}`);
        } else {
          console.log(`⚠️  Opérateur existe déjà: ${operatorData.email}`);
        }
        
      } catch (err) {
        console.error(`❌ Erreur pour ${magasinData.nom}:`, err.message);
      }
    }
    
    // Créer aussi un compte manager général
    const managerData = {
      email: 'manager@its-sn.com',
      password: 'manager123',
      nom: 'Manager',
      prenom: 'Général',
      role: 'manager',
      actif: true
    };
    
    const existingManager = await User.findOne({ where: { email: managerData.email } });
    
    if (!existingManager) {
      const hashedPassword = await bcrypt.hash(managerData.password, 10);
      await User.create({
        ...managerData,
        password: hashedPassword
      });
      console.log(`✅ Manager créé: ${managerData.email}`);
    }
    
    console.log('\n✅ Initialisation terminée !');
    console.log('\n📋 Credentials des opérateurs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Magasin                 | Email                              | Mot de passe');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Port de Dakar          | operator.dkr-port@its-sn.com       | operator123');
    console.log('Zone Industrielle      | operator.dkr-ind@its-sn.com        | operator123');
    console.log('Thiès                  | operator.thies@its-sn.com          | operator123');
    console.log('Saint-Louis            | operator.stl@its-sn.com            | operator123');
    console.log('Kaolack                | operator.kaol@its-sn.com           | operator123');
    console.log('Ziguinchor             | operator.zigui@its-sn.com          | operator123');
    console.log('Tambacounda            | operator.tamb@its-sn.com           | operator123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Compte Manager:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Manager Général        | manager@its-sn.com                 | manager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

initMagasinsAndOperators();