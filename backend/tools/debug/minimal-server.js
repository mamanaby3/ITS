require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route de test
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Route de login simplifiée
app.post('/api/auth/login', async (req, res) => {
  console.log('🔄 Login attempt:', req.body.email);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Email ou mot de passe manquant');
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis' 
      });
    }
    
    console.log('1️⃣ Recherche utilisateur...');
    const user = await User.findOne({ 
      where: { email, actif: true }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }
    
    console.log('2️⃣ Vérification mot de passe...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide');
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }
    
    console.log('3️⃣ Génération token...');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login réussi');
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          magasin_id: user.magasin_id
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la connexion',
      details: error.message 
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'NON DÉFINI');
});