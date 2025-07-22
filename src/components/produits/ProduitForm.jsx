// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from 'react';
import produitsService from '../../services/produits';
import { XMarkIcon, PlusIcon } from '../ui/SimpleIcons';

const ProduitForm = ({ produit = null, onSubmit, onCancel, isEditing = false }) => {
    const [formData, setFormData] = useState({
        nom: '',
        reference: '',
        categorie: '',
        prix: '',
        prixVente: '',
        seuil: '',
        description: '',
        destination: 'stockage',
        peut_etre_distribue: true,
        notes_destination: ''
    });

    const [categories, setCategories] = useState([]);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Charger les catégories
        setCategories(produitsService.getCategories());

        // Si on édite un produit, remplir le formulaire
        if (isEditing && produit) {
            setFormData({
                nom: produit.nom || '',
                reference: produit.reference || '',
                categorie: produit.categorie || '',
                prix: produit.prix || '',
                prixVente: produit.prixVente || '',
                seuil: produit.seuil || '',
                description: produit.description || '',
                destination: produit.destination || 'stockage',
                peut_etre_distribue: produit.peut_etre_distribue !== undefined ? produit.peut_etre_distribue : true,
                notes_destination: produit.notes_destination || ''
            });
        }
    }, [produit, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Nettoyer l'erreur du champ modifié
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            const updatedCategories = produitsService.addCategorie(newCategory.trim());
            setCategories(updatedCategories);
            setFormData(prev => ({
                ...prev,
                categorie: newCategory.trim()
            }));
            setNewCategory('');
            setShowNewCategory(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est obligatoire';
        }

        if (!formData.reference.trim()) {
            newErrors.reference = 'La référence est obligatoire';
        }

        if (!formData.categorie) {
            newErrors.categorie = 'La catégorie est obligatoire';
        }

        if (!formData.prix || parseFloat(formData.prix) <= 0) {
            newErrors.prix = 'Le prix d\'achat doit être supérieur à 0';
        }

        if (!formData.prixVente || parseFloat(formData.prixVente) <= 0) {
            newErrors.prixVente = 'Le prix de vente doit être supérieur à 0';
        }

        if (parseFloat(formData.prixVente) <= parseFloat(formData.prix)) {
            newErrors.prixVente = 'Le prix de vente doit être supérieur au prix d\'achat';
        }

        if (!formData.seuil || parseInt(formData.seuil) < 0) {
            newErrors.seuil = 'Le seuil doit être un nombre positif';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const produitData = {
                ...formData,
                prix: parseFloat(formData.prix),
                prixVente: parseFloat(formData.prixVente),
                seuil: parseInt(formData.seuil)
            };

            await onSubmit(produitData);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const calculateMarge = () => {
        const prix = parseFloat(formData.prix) || 0;
        const prixVente = parseFloat(formData.prixVente) || 0;
        const marge = prixVente - prix;
        const margePercent = prix > 0 ? ((marge / prix) * 100) : 0;
        return { marge, margePercent };
    };

    const { marge, margePercent } = calculateMarge();

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-8 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-lg bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Erreur générale */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nom du produit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom du produit *
                            </label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.nom ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: Maïs jaune, Soja, Blé tendre"
                            />
                            {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                        </div>

                        {/* Référence */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Référence *
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.reference ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: MAIS-001, SOJA-BR-002"
                            />
                            {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
                        </div>

                        {/* Catégorie */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catégorie *
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    name="categorie"
                                    value={formData.categorie}
                                    onChange={handleChange}
                                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.categorie ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Sélectionner un type de marchandise</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(true)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </div>
                            {errors.categorie && <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>}

                            {/* Nouvelle catégorie */}
                            {showNewCategory && (
                                <div className="mt-2 flex space-x-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="Nouvelle catégorie"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                                    >
                                        Ajouter
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCategory(false);
                                            setNewCategory('');
                                        }}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Seuil minimum */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seuil minimum *
                            </label>
                            <input
                                type="number"
                                name="seuil"
                                value={formData.seuil}
                                onChange={handleChange}
                                min="0"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.seuil ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: 5"
                            />
                            {errors.seuil && <p className="mt-1 text-sm text-red-600">{errors.seuil}</p>}
                        </div>

                        {/* Prix d'achat */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix d'achat (FCFA) *
                            </label>
                            <input
                                type="number"
                                name="prix"
                                value={formData.prix}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.prix ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: 175000 (prix par tonne)"
                            />
                            {errors.prix && <p className="mt-1 text-sm text-red-600">{errors.prix}</p>}
                        </div>

                        {/* Prix de vente */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix de vente (FCFA) *
                            </label>
                            <input
                                type="number"
                                name="prixVente"
                                value={formData.prixVente}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.prixVente ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: 195000 (prix par tonne)"
                            />
                            {errors.prixVente && <p className="mt-1 text-sm text-red-600">{errors.prixVente}</p>}

                            {/* Calcul de marge */}
                            {formData.prix && formData.prixVente && marge > 0 && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-sm text-green-700">
                                        Marge: {marge.toLocaleString()} FCFA ({margePercent.toFixed(1)}%)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description de la marchandise (origine, qualité, spécifications...)"
                        />
                    </div>

                    {/* Section Destination */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Destination et utilisation</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type de destination */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de destination
                                </label>
                                <select
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="stockage">Stockage - Entreposage longue durée</option>
                                    <option value="distribution">Distribution - Livraison directe aux clients</option>
                                    <option value="transformation">Transformation - Traitement industriel</option>
                                    <option value="export">Export - Exportation vers l'étranger</option>
                                </select>
                            </div>

                            {/* Peut être distribué */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Statut de distribution
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="peut_etre_distribue"
                                        checked={formData.peut_etre_distribue}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            peut_etre_distribue: e.target.checked
                                        }))}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        Peut être distribué aux clients
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes destination */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes sur la destination
                            </label>
                            <textarea
                                name="notes_destination"
                                value={formData.notes_destination}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Conditions spéciales, restrictions, instructions particulières..."
                            />
                        </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isEditing ? 'Modification...' : 'Création...'}
                                </div>
                            ) : (
                                isEditing ? 'Modifier' : 'Créer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProduitForm;