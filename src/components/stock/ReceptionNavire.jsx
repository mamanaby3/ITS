import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import stockService from '../../services/stock';
import produitsService from '../../services/produits';
import magasinsService from '../../services/magasins';
import {
    TruckIcon,
    CubeIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon
} from '../ui/SimpleIcons';

const ReceptionNavire = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        dateReception: new Date().toISOString().split('T')[0],
        navire: '',
        numeroConteneur: '',
        fournisseur: '',
        produits: []
    });
    
    const [produitsList, setProduitsList] = useState([]);
    const [magasinsList, setMagasinsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState({});
    const [currentProduit, setCurrentProduit] = useState({
        produit_id: '',
        quantiteTotal: '',
        lot: '',
        dateExpiration: '',
        prixUnitaire: '',
        dispatch: [] // Distribution par magasin
    });
    const [showDispatch, setShowDispatch] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoadingData(true);
            const [produitsData, magasinsData] = await Promise.all([
                produitsService.getAll(),
                magasinsService.getAll()
            ]);
            setProduitsList(produitsData);
            setMagasinsList(magasinsData);
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAddProduit = () => {
        if (!currentProduit.produit_id || !currentProduit.quantiteTotal) {
            setErrors({ produit: 'Veuillez sélectionner un produit et saisir la quantité' });
            return;
        }

        const quantiteTotal = parseInt(currentProduit.quantiteTotal);
        const produit = produitsList.find(p => p.id === currentProduit.produit_id);
        
        // Initialiser la distribution pour chaque magasin
        const dispatch = magasinsList.map(mag => ({
            magasin_id: mag.id,
            magasin_nom: mag.nom,
            quantite: 0
        }));

        setFormData({
            ...formData,
            produits: [...formData.produits, {
                ...currentProduit,
                quantiteTotal,
                produit,
                dispatch
            }]
        });

        // Réinitialiser le formulaire produit
        setCurrentProduit({
            produit_id: '',
            quantiteTotal: '',
            lot: '',
            dateExpiration: '',
            prixUnitaire: '',
            dispatch: []
        });
        setErrors({});
    };

    const handleUpdateDispatch = (produitIndex, magasinId, quantite) => {
        const updatedProduits = [...formData.produits];
        const produit = updatedProduits[produitIndex];
        
        const dispatchIndex = produit.dispatch.findIndex(d => d.magasin_id === magasinId);
        if (dispatchIndex >= 0) {
            produit.dispatch[dispatchIndex].quantite = parseInt(quantite) || 0;
        }

        setFormData({ ...formData, produits: updatedProduits });
    };

    const getTotalDispatched = (produitIndex) => {
        const produit = formData.produits[produitIndex];
        return produit.dispatch.reduce((sum, d) => sum + (d.quantite || 0), 0);
    };

    const handleRemoveProduit = (index) => {
        const updatedProduits = formData.produits.filter((_, i) => i !== index);
        setFormData({ ...formData, produits: updatedProduits });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.navire) newErrors.navire = 'Le nom du navire est requis';
        if (formData.produits.length === 0) newErrors.produits = 'Ajoutez au moins un produit';

        // Vérifier que toutes les quantités sont distribuées
        formData.produits.forEach((produit, index) => {
            const totalDispatched = getTotalDispatched(index);
            if (totalDispatched !== produit.quantiteTotal) {
                newErrors[`dispatch_${index}`] = `Quantité distribuée (${totalDispatched}) différente de la quantité totale (${produit.quantiteTotal})`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        try {
            setLoading(true);

            // Préparer les données pour l'envoi
            const receptionData = {
                ...formData,
                utilisateur_id: user.id,
                type: 'reception_navire'
            };

            // Enregistrer la réception et créer les entrées dans chaque magasin
            await stockService.receptionNavire(receptionData);

            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la réception:', error);
            setErrors({ submit: error.message || 'Erreur lors de l\'enregistrement' });
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <TruckIcon className="h-6 w-6 text-green-600 mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">Réception Navire</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Informations générales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de réception
                            </label>
                            <input
                                type="date"
                                value={formData.dateReception}
                                onChange={(e) => setFormData({...formData, dateReception: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du navire *
                            </label>
                            <input
                                type="text"
                                value={formData.navire}
                                onChange={(e) => setFormData({...formData, navire: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: MV ATLANTIC STAR"
                                required
                            />
                            {errors.navire && (
                                <p className="text-red-500 text-sm mt-1">{errors.navire}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                N° Conteneur
                            </label>
                            <input
                                type="text"
                                value={formData.numeroConteneur}
                                onChange={(e) => setFormData({...formData, numeroConteneur: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: MSKU1234567"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fournisseur
                            </label>
                            <input
                                type="text"
                                value={formData.fournisseur}
                                onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nom du fournisseur"
                            />
                        </div>
                    </div>

                    {/* Ajout de produits */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter des produits</h3>
                        
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Produit *
                                    </label>
                                    <select
                                        value={currentProduit.produit_id}
                                        onChange={(e) => setCurrentProduit({...currentProduit, produit_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {produitsList.map(produit => (
                                            <option key={produit.id} value={produit.id}>
                                                {produit.nom} - {produit.reference}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantité totale *
                                    </label>
                                    <input
                                        type="number"
                                        value={currentProduit.quantiteTotal}
                                        onChange={(e) => setCurrentProduit({...currentProduit, quantiteTotal: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lot
                                    </label>
                                    <input
                                        type="text"
                                        value={currentProduit.lot}
                                        onChange={(e) => setCurrentProduit({...currentProduit, lot: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="N° de lot"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date d'expiration
                                    </label>
                                    <input
                                        type="date"
                                        value={currentProduit.dateExpiration}
                                        onChange={(e) => setCurrentProduit({...currentProduit, dateExpiration: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix unitaire
                                    </label>
                                    <input
                                        type="number"
                                        value={currentProduit.prixUnitaire}
                                        onChange={(e) => setCurrentProduit({...currentProduit, prixUnitaire: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={handleAddProduit}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Ajouter
                                    </button>
                                </div>
                            </div>

                            {errors.produit && (
                                <p className="text-red-500 text-sm">{errors.produit}</p>
                            )}
                        </div>
                    </div>

                    {/* Liste des produits ajoutés */}
                    {formData.produits.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Produits à réceptionner ({formData.produits.length})
                            </h3>

                            {errors.produits && (
                                <p className="text-red-500 text-sm mb-2">{errors.produits}</p>
                            )}

                            <div className="space-y-4">
                                {formData.produits.map((item, index) => (
                                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    {item.produit.nom}
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    Quantité totale: {item.quantiteTotal} | 
                                                    {item.lot && ` Lot: ${item.lot} |`}
                                                    {item.prixUnitaire && ` Prix: ${item.prixUnitaire} FCFA`}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduit(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Distribution par magasin */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="text-sm font-medium text-gray-700">
                                                    Distribution par magasin
                                                </h5>
                                                <span className={`text-sm ${
                                                    getTotalDispatched(index) === item.quantiteTotal 
                                                        ? 'text-green-600' 
                                                        : 'text-red-600'
                                                }`}>
                                                    Total distribué: {getTotalDispatched(index)} / {item.quantiteTotal}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {item.dispatch.map((dispatch, dIndex) => (
                                                    <div key={dIndex} className="flex items-center space-x-2">
                                                        <label className="text-sm text-gray-600 flex-1">
                                                            {dispatch.magasin_nom}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={dispatch.quantite}
                                                            onChange={(e) => handleUpdateDispatch(index, dispatch.magasin_id, e.target.value)}
                                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            min="0"
                                                            max={item.quantiteTotal}
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {errors[`dispatch_${index}`] && (
                                                <p className="text-red-500 text-sm mt-2">
                                                    {errors[`dispatch_${index}`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Erreur générale */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">{errors.submit}</p>
                        </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || formData.produits.length === 0}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                    Valider la réception
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReceptionNavire;