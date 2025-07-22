// src/components/stock/SortieForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stock';
import produitsService from '../../services/produits';
import { XMarkIcon, TruckIcon, ExclamationTriangleIcon } from '../ui/SimpleIcons';

const SortieForm = ({ onSubmit, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        produitId: '',
        quantite: '',
        motif: '',
        client: '',
        destination: '',
        numeroCommande: '',
        observation: ''
    });

    const [produits, setProduits] = useState([]);
    const [produitsWithStock, setProduitsWithStock] = useState([]);
    const [selectedProduit, setSelectedProduit] = useState(null);
    const [stockDisponible, setStockDisponible] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [produitsData, stockData] = await Promise.all([
                produitsService.getAllProduits(),
                stockService.getAllStock()
            ]);

            setProduits(produitsData);

            // Calculer le stock disponible pour chaque produit
            const produitsAvecStock = produitsData.map(produit => {
                const stockItems = stockData.filter(s => s.produitId === produit.id);
                const quantiteTotal = stockItems.reduce((sum, s) => sum + s.quantite, 0);
                return {
                    ...produit,
                    quantiteEnStock: quantiteTotal,
                    stockItems: stockItems
                };
            }).filter(p => p.quantiteEnStock > 0); // Seuls les produits en stock

            setProduitsWithStock(produitsAvecStock);
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

        // Si le produit change, mettre à jour les informations de stock
        if (name === 'produitId' && value) {
            const produit = produitsWithStock.find(p => p.id === parseInt(value));
            setSelectedProduit(produit);
            setStockDisponible(produit ? produit.quantiteEnStock : 0);
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

        if (parseInt(formData.quantite) > stockDisponible) {
            newErrors.quantite = `Quantité demandée (${formData.quantite}) supérieure au stock disponible (${stockDisponible})`;
        }

        if (!formData.motif.trim()) {
            newErrors.motif = 'Le motif est obligatoire';
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
            const sortieData = {
                ...formData,
                utilisateur: `${user?.prenom} ${user?.nom}`,
                type: 'sortie'
            };

            await onSubmit(sortieData);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getStockDetails = () => {
        if (!selectedProduit || !selectedProduit.stockItems) return null;

        return selectedProduit.stockItems.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm">
                <span>{item.emplacement}</span>
                <span className="font-medium">{item.quantite} unités</span>
            </div>
        ));
    };

    const getStockStatus = () => {
        if (!selectedProduit) return null;

        if (stockDisponible === 0) {
            return (
                <div className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Rupture de stock</span>
                </div>
            );
        } else if (stockDisponible <= (selectedProduit.seuil || selectedProduit.seuilAlerte || 0)) {
            return (
                <div className="flex items-center text-yellow-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Stock bas</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center text-green-600">
                    <span className="text-sm">Stock suffisant</span>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <TruckIcon className="h-6 w-6 text-red-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Nouvelle Sortie de Stock
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                    errors.produitId ? 'border-red-300' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Sélectionner un produit</option>
                                {produitsWithStock.map((produit) => (
                                    <option key={produit.id} value={produit.id}>
                                        {produit.nom} - {produit.reference} (Stock: {produit.quantiteEnStock})
                                    </option>
                                ))}
                            </select>
                            {errors.produitId && <p className="mt-1 text-sm text-red-600">{errors.produitId}</p>}

                            {/* Informations du produit sélectionné */}
                            {selectedProduit && (
                                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm text-blue-800">
                                                <strong>Catégorie:</strong> {selectedProduit.categorie}
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                <strong>Prix de vente:</strong> {selectedProduit.prixVente?.toLocaleString()} FCFA
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-900">
                                                {stockDisponible} unités
                                            </p>
                                            {getStockStatus()}
                                        </div>
                                    </div>

                                    {/* Détail par emplacement */}
                                    <div className="border-t border-blue-200 pt-3">
                                        <p className="text-sm font-medium text-blue-800 mb-2">Répartition par emplacement :</p>
                                        <div className="space-y-1">
                                            {getStockDetails()}
                                        </div>
                                    </div>
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
                                max={stockDisponible}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                    errors.quantite ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder={`Max: ${stockDisponible}`}
                            />
                            {errors.quantite && <p className="mt-1 text-sm text-red-600">{errors.quantite}</p>}
                            {stockDisponible > 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum disponible: {stockDisponible} unités
                                </p>
                            )}
                        </div>

                        {/* Valeur estimée */}
                        {formData.quantite && selectedProduit && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valeur estimée
                                </label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="text-lg font-semibold text-red-600">
                    {(parseInt(formData.quantite) * (selectedProduit.prixVente || 0)).toLocaleString()} FCFA
                  </span>
                                </div>
                            </div>
                        )}

                        {/* Client */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client / Bénéficiaire
                            </label>
                            <input
                                type="text"
                                name="client"
                                value={formData.client}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Nom du client ou bénéficiaire"
                            />
                        </div>

                        {/* Destination */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Destination
                            </label>
                            <input
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Lieu de livraison"
                            />
                        </div>

                        {/* Numéro de commande */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                N° de commande
                            </label>
                            <input
                                type="text"
                                name="numeroCommande"
                                value={formData.numeroCommande}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Ex: CMD-2024-001"
                            />
                        </div>
                    </div>

                    {/* Motif */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motif de la sortie *
                        </label>
                        <select
                            name="motif"
                            value={formData.motif}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                                errors.motif ? 'border-red-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Sélectionner un motif</option>
                            <option value="Vente client">Vente client</option>
                            <option value="Livraison commande">Livraison commande</option>
                            <option value="Transfert entrepôt">Transfert entrepôt</option>
                            <option value="Utilisation interne">Utilisation interne</option>
                            <option value="Échantillon gratuit">Échantillon gratuit</option>
                            <option value="Perte / Casse">Perte / Casse</option>
                            <option value="Correction inventaire">Correction inventaire</option>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                            disabled={loading || stockDisponible === 0}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                                'Enregistrer la sortie'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SortieForm;