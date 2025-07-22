// src/components/stock/EntreeForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stock';
import produitsService from '../../services/produits';
import { XMarkIcon, CubeIcon } from '../ui/SimpleIcons';

const EntreeForm = ({ onSubmit, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        produitId: '',
        quantite: '',
        emplacement: '',
        motif: '',
        fournisseur: '',
        numeroLot: '',
        dateExpiration: '',
        prixUnitaire: '',
        observation: ''
    });

    const [produits, setProduits] = useState([]);
    const [emplacements, setEmplacements] = useState([]);
    const [selectedProduit, setSelectedProduit] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [produitsData, emplacementsData] = await Promise.all([
                produitsService.getAllProduits(),
                stockService.getEmplacements()
            ]);
            setProduits(produitsData);
            setEmplacements(emplacementsData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    };

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

        // Si le produit change, mettre à jour le prix unitaire
        if (name === 'produitId' && value) {
            const produit = produits.find(p => p.id === parseInt(value));
            setSelectedProduit(produit);
            if (produit) {
                setFormData(prev => ({
                    ...prev,
                    prixUnitaire: produit.prix.toString()
                }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.produitId) {
            newErrors.produitId = 'Le produit est obligatoire';
        }

        if (!formData.quantite || parseInt(formData.quantite) <= 0) {
            newErrors.quantite = 'La quantité doit être supérieure à 0';
        }

        if (!formData.emplacement) {
            newErrors.emplacement = 'L\'emplacement est obligatoire';
        }

        if (!formData.motif.trim()) {
            newErrors.motif = 'Le motif est obligatoire';
        }

        if (formData.prixUnitaire && parseFloat(formData.prixUnitaire) <= 0) {
            newErrors.prixUnitaire = 'Le prix unitaire doit être supérieur à 0';
        }

        if (formData.dateExpiration) {
            const dateExp = new Date(formData.dateExpiration);
            const today = new Date();
            if (dateExp <= today) {
                newErrors.dateExpiration = 'La date d\'expiration doit être future';
            }
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
            const entreeData = {
                ...formData,
                utilisateur: `${user?.prenom} ${user?.nom}`,
                type: 'entree'
            };

            await onSubmit(entreeData);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const calculateValeurTotale = () => {
        const quantite = parseInt(formData.quantite) || 0;
        const prix = parseFloat(formData.prixUnitaire) || 0;
        return quantite * prix;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <CubeIcon className="h-6 w-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Nouvelle Entrée de Stock
                        </h3>
                    </div>
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
                        {/* Produit */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Produit *
                            </label>
                            <select
                                name="produitId"
                                value={formData.produitId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    errors.produitId ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Sélectionner un produit</option>
                                {produits.map((produit) => (
                                    <option key={produit.id} value={produit.id}>
                                        {produit.nom} - {produit.reference}
                                    </option>
                                ))}
                            </select>
                            {errors.produitId && <p className="mt-1 text-sm text-red-600">{errors.produitId}</p>}

                            {/* Informations du produit sélectionné */}
                            {selectedProduit && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                        <strong>Catégorie:</strong> {selectedProduit.categorie} |
                                        <strong> Prix d'achat:</strong> {selectedProduit.prix.toLocaleString()} FCFA |
                                        <strong> Seuil:</strong> {selectedProduit.seuil || selectedProduit.seuilAlerte || 0}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quantité */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantité *
                            </label>
                            <input
                                type="number"
                                name="quantite"
                                value={formData.quantite}
                                onChange={handleChange}
                                min="1"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    errors.quantite ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Ex: 10"
                            />
                            {errors.quantite && <p className="mt-1 text-sm text-red-600">{errors.quantite}</p>}
                        </div>

                        {/* Emplacement */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Emplacement *
                            </label>
                            <select
                                name="emplacement"
                                value={formData.emplacement}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    errors.emplacement ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Sélectionner un emplacement</option>
                                {emplacements.map((emp) => (
                                    <option key={emp.code} value={emp.code}>
                                        {emp.code} - {emp.description}
                                    </option>
                                ))}
                            </select>
                            {errors.emplacement && <p className="mt-1 text-sm text-red-600">{errors.emplacement}</p>}
                        </div>

                        {/* Prix unitaire */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix unitaire (FCFA)
                            </label>
                            <input
                                type="number"
                                name="prixUnitaire"
                                value={formData.prixUnitaire}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    errors.prixUnitaire ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Prix d'achat unitaire"
                            />
                            {errors.prixUnitaire && <p className="mt-1 text-sm text-red-600">{errors.prixUnitaire}</p>}
                        </div>

                        {/* Valeur totale (calculée) */}
                        {formData.quantite && formData.prixUnitaire && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valeur totale
                                </label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="text-lg font-semibold text-green-600">
                    {calculateValeurTotale().toLocaleString()} FCFA
                  </span>
                                </div>
                            </div>
                        )}

                        {/* Fournisseur */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fournisseur
                            </label>
                            <input
                                type="text"
                                name="fournisseur"
                                value={formData.fournisseur}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Nom du fournisseur"
                            />
                        </div>

                        {/* Numéro de lot */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro de lot
                            </label>
                            <input
                                type="text"
                                name="numeroLot"
                                value={formData.numeroLot}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Ex: LOT-2024-001"
                            />
                        </div>

                        {/* Date d'expiration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date d'expiration
                            </label>
                            <input
                                type="date"
                                name="dateExpiration"
                                value={formData.dateExpiration}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    errors.dateExpiration ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.dateExpiration && <p className="mt-1 text-sm text-red-600">{errors.dateExpiration}</p>}
                        </div>
                    </div>

                    {/* Motif */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motif de l'entrée *
                        </label>
                        <select
                            name="motif"
                            value={formData.motif}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                errors.motif ? 'border-red-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Sélectionner un motif</option>
                            <option value="Achat fournisseur">Achat fournisseur</option>
                            <option value="Retour client">Retour client</option>
                            <option value="Transfert entrepôt">Transfert entrepôt</option>
                            <option value="Correction inventaire">Correction inventaire</option>
                            <option value="Production interne">Production interne</option>
                            <option value="Autre">Autre</option>
                        </select>
                        {errors.motif && <p className="mt-1 text-sm text-red-600">{errors.motif}</p>}
                    </div>

                    {/* Observation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observation
                        </label>
                        <textarea
                            name="observation"
                            value={formData.observation}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Observations ou commentaires..."
                        />
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
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enregistrement...
                                </div>
                            ) : (
                                'Enregistrer l\'entrée'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntreeForm;