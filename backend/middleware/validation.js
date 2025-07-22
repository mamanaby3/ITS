const { body, param, query, validationResult } = require('express-validator');

// Validation des mots de passe forts
const passwordValidation = () => [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

// Validation de l'email
const emailValidation = () => [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .toLowerCase()
];

// Validation de connexion
const loginValidation = () => [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation de l'inscription
const registerValidation = () => [
  ...emailValidation(),
  ...passwordValidation(),
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  body('role')
    .isIn(['admin', 'gerant', 'operateur', 'magasinier'])
    .withMessage('Rôle invalide')
];

// Validation des produits
const produitValidation = () => [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères')
    .escape(),
  body('reference')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('La référence doit contenir entre 3 et 50 caractères')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('La référence ne peut contenir que des lettres majuscules, chiffres et tirets'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut dépasser 500 caractères')
    .escape(),
  body('prix')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('seuil_critique')
    .isInt({ min: 0 })
    .withMessage('Le seuil critique doit être un nombre entier positif')
];

// Validation des stocks
const stockValidation = () => [
  body('quantite')
    .isInt({ min: 0 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('produit_id')
    .isInt()
    .withMessage('ID de produit invalide'),
  body('magasin_id')
    .isInt()
    .withMessage('ID de magasin invalide')
];

// Validation des commandes
const commandeValidation = () => [
  body('client_id')
    .isInt()
    .withMessage('ID de client invalide'),
  body('produits')
    .isArray({ min: 1 })
    .withMessage('La commande doit contenir au moins un produit'),
  body('produits.*.produit_id')
    .isInt()
    .withMessage('ID de produit invalide'),
  body('produits.*.quantite')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être supérieure à 0'),
  body('produits.*.prix_unitaire')
    .isFloat({ min: 0 })
    .withMessage('Le prix unitaire doit être positif')
];

// Validation de recherche (protection contre les injections)
const searchValidation = () => [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La recherche ne peut dépasser 100 caractères')
    .matches(/^[a-zA-Z0-9À-ÿ\s\-._]+$/)
    .withMessage('Caractères non autorisés dans la recherche')
];

// Validation de pagination
const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
];

// Validation des IDs dans les paramètres
const idParamValidation = () => [
  param('id')
    .isInt()
    .withMessage('ID invalide')
];

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Fonction de sanitisation personnalisée
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Supprimer les balises HTML
  value = value.replace(/<[^>]*>/g, '');
  
  // Échapper les caractères spéciaux
  value = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return value.trim();
};

// Validations pour les utilisateurs
const validateCreateUser = () => [
  ...emailValidation(),
  ...passwordValidation(),
  body('nom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('role')
    .isIn(['admin', 'gerant', 'operateur', 'magasinier'])
    .withMessage('Rôle invalide')
];

const validateUpdateUser = () => [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'gerant', 'operateur', 'magasinier'])
    .withMessage('Rôle invalide')
];

const validatePasswordReset = () => passwordValidation();

// Validation des produits (compatibilité)
const validateCreateProduit = produitValidation;
const validateUpdateProduit = () => [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères')
    .escape(),
  body('prix')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('seuil_critique')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le seuil critique doit être un nombre entier positif')
];

// Validation des stocks (compatibilité)
const validateStockUpdate = stockValidation;

// Validations spécifiques pour les opérations de stock
const validateAddStock = () => [
  body('produit_id')
    .isInt()
    .withMessage('ID de produit invalide'),
  body('magasin_id')
    .isInt()
    .withMessage('ID de magasin invalide'),
  body('quantite')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('La référence ne peut dépasser 50 caractères'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent dépasser 500 caractères')
    .escape()
];

const validateRemoveStock = () => [
  body('produit_id')
    .isInt()
    .withMessage('ID de produit invalide'),
  body('magasin_id')
    .isInt()
    .withMessage('ID de magasin invalide'),
  body('quantite')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('motif')
    .trim()
    .notEmpty()
    .withMessage('Le motif est requis')
    .isLength({ max: 200 })
    .withMessage('Le motif ne peut dépasser 200 caractères')
    .escape()
];

const validateTransferStock = () => [
  body('produit_id')
    .isInt()
    .withMessage('ID de produit invalide'),
  body('magasin_source_id')
    .isInt()
    .withMessage('ID de magasin source invalide'),
  body('magasin_destination_id')
    .isInt()
    .withMessage('ID de magasin destination invalide')
    .custom((value, { req }) => value !== req.body.magasin_source_id)
    .withMessage('Les magasins source et destination doivent être différents'),
  body('quantite')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent dépasser 500 caractères')
    .escape()
];

// Validation des commandes (compatibilité)
const validateCreateCommande = commandeValidation;

const validateUpdateCommandeStatus = () => [
  body('statut')
    .isIn(['en_attente', 'validée', 'en_preparation', 'livrée', 'annulée'])
    .withMessage('Statut de commande invalide')
];

// Validation des clients
const validateCreateClient = () => [
  body('nom')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du client doit contenir entre 2 et 100 caractères')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('telephone')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s\-().]+$/)
    .withMessage('Numéro de téléphone invalide'),
  body('adresse')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut dépasser 200 caractères')
    .escape(),
  body('type')
    .optional()
    .isIn(['particulier', 'entreprise'])
    .withMessage('Type de client invalide')
];

const validateUpdateClient = () => [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du client doit contenir entre 2 et 100 caractères')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('telephone')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s\-().]+$/)
    .withMessage('Numéro de téléphone invalide'),
  body('adresse')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut dépasser 200 caractères')
    .escape()
];

// Validation des livraisons
const validateCreateLivraison = () => [
  body('commande_id')
    .isInt()
    .withMessage('ID de commande invalide'),
  body('transporteur')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom du transporteur ne peut dépasser 100 caractères')
    .escape(),
  body('vehicule')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le véhicule ne peut dépasser 50 caractères')
    .escape(),
  body('chauffeur')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom du chauffeur ne peut dépasser 100 caractères')
    .escape()
];

const validateUpdateLivraison = () => [
  body('statut')
    .optional()
    .isIn(['en_preparation', 'en_cours', 'livree', 'annulee'])
    .withMessage('Statut invalide'),
  body('transporteur')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom du transporteur ne peut dépasser 100 caractères')
    .escape()
];

const validateUpdateLivraisonStatus = () => [
  body('statut')
    .isIn(['en_preparation', 'en_cours', 'livree', 'annulee'])
    .withMessage('Statut de livraison invalide')
];

// Alias pour la compatibilité
const validateLogin = loginValidation;
const validateRegister = registerValidation;
const validatePasswordUpdate = passwordValidation;

module.exports = {
  // Validations de base
  passwordValidation,
  emailValidation,
  loginValidation,
  registerValidation,
  produitValidation,
  stockValidation,
  commandeValidation,
  searchValidation,
  paginationValidation,
  idParamValidation,
  handleValidationErrors,
  sanitizeInput,
  
  // Validations spécifiques pour compatibilité
  validateCreateUser,
  validateUpdateUser,
  validatePasswordReset,
  validateCreateProduit,
  validateUpdateProduit,
  validateStockUpdate,
  validateCreateCommande,
  validateLogin,
  validateRegister,
  validatePasswordUpdate,
  validateCreateClient,
  validateUpdateClient,
  validateCreateLivraison,
  validateUpdateLivraison,
  validateUpdateCommandeStatus,
  validateUpdateLivraisonStatus,
  validateAddStock,
  validateRemoveStock,
  validateTransferStock
};