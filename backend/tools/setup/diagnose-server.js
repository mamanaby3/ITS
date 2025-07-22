require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('./config/database');
const { User } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Route de diagnostic
app.post('/diagnose', async (req, res) => {
  const { email, password } = req.body;
  const diagnostics = {
    request: { email, passwordProvided: !!password },
    environment: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
      NODE_ENV: process.env.NODE_ENV
    },
    database: {
      connected: false,
      userTable: null,
      userFound: false,
      userDetails: null
    },
    authentication: {
      passwordValid: false,
      tokenGenerated: false
    },
    errors: []
  };

  try {
    // Test connexion DB
    await sequelize.authenticate();
    diagnostics.database.connected = true;

    // Vérifier la table utilisée
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'utilisateurs'");
    diagnostics.database.userTable = tables.length > 0 ? 'utilisateurs' : 'unknown';

    // Chercher l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (user) {
      diagnostics.database.userFound = true;
      diagnostics.database.userDetails = {
        id: user.id,
        email: user.email,
        role: user.role,
        actif: user.actif,
        hasPassword: !!user.password
      };

      // Tester le mot de passe
      if (password) {
        const isValid = await bcrypt.compare(password, user.password);
        diagnostics.authentication.passwordValid = isValid;

        // Tester la génération de token
        if (isValid) {
          try {
            const token = jwt.sign(
              { userId: user.id },
              process.env.JWT_SECRET || 'test-secret',
              { expiresIn: '24h' }
            );
            diagnostics.authentication.tokenGenerated = !!token;
          } catch (tokenError) {
            diagnostics.errors.push({
              step: 'token_generation',
              error: tokenError.message
            });
          }
        }
      }
    }
  } catch (error) {
    diagnostics.errors.push({
      step: 'general',
      error: error.message,
      stack: error.stack
    });
  }

  res.json(diagnostics);
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`🔍 Diagnostic server running on port ${PORT}`);
  console.log('Test with: curl -X POST http://localhost:5002/diagnose -H "Content-Type: application/json" -d \'{"email":"manager@its-senegal.com","password":"manager123"}\'');
});