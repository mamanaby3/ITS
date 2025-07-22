// src/components/commandes/CommandeForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import commandesService from '../../services/commandes';
import clientsService from '../../services/clients';
import produitsService from '../../services/produits';
import stockService from '../../services/stock';
import { XMarkIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '../ui/SimpleIcons';

const CommandeForm = ({ commande = null, onSubmit, onCancel, isEditing = false }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        clientId: '',
        dateCommande: new Date().toISOString().split('T')[0],
        dateLivraisonPrevue: '',
        adresseLivraison: '',
        contactLivraison: '',
        telephoneLivraison: '',
        observation: '',
        tauxTva: 18
    });

    const [lignes, setLignes] = useState([]);
    const [clients, setClients] = useState([]);
    const [produits, setProduits] = useState([]);
    const [produitsWithStock, setProduitsWithStock] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingStock, setLoadingStock] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadProduitsWithStock();
    }, [produits]);

    useEffect(() => {
        if (isEditing && commande) {
            setFormData({
                clientId: commande.clientId || '',
                dateCommande: commande.dateCommande ? commande.dateCommande.split('T')[0] : new Date().toISOString().split('T')[0],
                dateLivraisonPrevue: commande.dateLivraisonPrevue ? commande.dateLivraisonPrevue.split('T')[0] : '',
                adresseLivraison: commande.adresseLivraison || '',
                contactLivraison: commande.contactLivraison || '',
                telephoneLivraison: commande.telephoneLivraison || '',
                observation: commande.observation || '',
                tauxTva: commande.tauxTva || 18
            });

            if (commande.lignes) {
                setLignes(commande.lignes.map(ligne => ({
                    id: ligne.id || Date.now() + Math.random(),
                    produitId: ligne.produitId,
                    quantite: ligne.quantite,
                    prixUnitaire: ligne.prixUnitaire,
                    total: ligne.total,
                    observation: ligne.observation || ''
                })));
            }

            if (commande.client) {
                setSelectedClient(commande.client);
            }
        }
    }, [commande, isEditing]);

    const loadData = async () => {
        try {
            const [clientsData, produitsData] = await Promise.all([
                clientsService.getAllClients(),
                produitsService.getAllProduits()
            ]);
            setClients(clientsData.filter(c => c.status === 'actif'));
            setProduits(produitsData);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    };

    const loadProduitsWithStock = async () => {
        try {
            const stockData = await stockService.getAllStock();

            const produitsAvecStock = produits.map(produit => {
                const stockItems = stockData.filter(s => s.produitId === produit.id);
                const quantiteEnStock = stockItems.reduce((sum, s) => sum + s.quantite, 0);
                return {
                    ...produit,
                    quantiteEnStock,
                    stockItems
                };
            });

            setProduitsWithStock(produitsAvecStock);
        } catch (error) {
            console.error('Erreur lors du chargement du stock:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Si le client change, mettre à jour les informations
        if (name === 'clientId' && value) {
            const client = clients.find(c => c.id === parseInt(value));
            setSelectedClient(client);
            if (client) {
                setFormData(prev => ({
                    ...prev,
                    adresseLivraison: client.adresse || '',
                    contactLivraison: client.contact || '',
                    telephoneLivraison: client.telephone || ''
                }));
            }
        }
    };

    const ajouterLigne = () => {
        const nouvelleLigne = {
            id: Date.now(),
            produitId: '',
            quantite: 1,
            prixUnitaire: 0,
            total: 0,
            observation: ''
        };
        setLignes([...lignes, nouvelleLigne]);
    };

    const supprimerLigne = (id) => {
        setLignes(lignes.filter(ligne => ligne.id !== id));
    };

    const updateLigne = async (id, field, value) => {
        const nouvellesLignes = lignes.map(ligne => {
            if (ligne.id === id) {
                const nouveauLigne = { ...ligne, [field]: value };

                // Si c'est le produit qui change, mettre à jour le prix
                if (field === 'produitId' && value) {
                    const produit = produitsWithStock.find(p => p.id === parseInt(value));
                    if (produit) {
                        nouveauLigne.prixUnitaire = produit.prixVente || 0;
                    }
                }

                // Recalculer le total
                if (field === 'quantite' || field === 'prixUnitaire' || field === 'produitId') {
                    nouveauLigne.total = (parseFloat(nouveauLigne.quantite) || 0) * (parseFloat(nouveauLigne.prixUnitaire) || 0);
                }

                return nouveauLigne;
            }
            return ligne;
        });

        setLignes(nouvellesLignes);

        // Vérifier le stock si c'est la quantité qui change
        if (field === 'quantite' || field === 'produitId') {
            const ligne = nouvellesLignes.find(l => l.id === id);
            if (ligne.produitId && ligne.quantite) {
                await verifierStock(ligne.produitId, ligne.quantite, id);
            }
        }
    };

    const verifierStock = async (produitId, quantite, ligneId) => {
        try {
            setLoadingStock(prev => ({ ...prev, [ligneId]: true }));
            const stockDisponible = await stockService.getQuantiteDisponible(produitId);

            if (stockDisponible < quantite) {
                setErrors(prev => ({
                    ...prev,
                    [`stock_${ligneId}`]: `Stock insuffisant. Disponible: ${stockDisponible}`
                }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[`stock_${ligneId}`];
                    return newErrors;
                });
            }
        } catch (error) {
            console.error('Erreur vérification stock:', error);
        } finally {
            setLoadingStock(prev => ({ ...prev, [ligneId]: false }));
        }
    };

    const calculerTotaux = () => {
        const sousTotal = lignes.reduce((sum, ligne) => sum + (ligne.total || 0), 0);
        const tva = (sousTotal * formData.tauxTva) / 100;
        const totalTTC = sousTotal + tva;

        return {
            sousTotal,
            tva,
            totalTTC
        };
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.clientId) {
            newErrors.clientId = 'Le client est obligatoire';
        }

        if (!formData.dateCommande) {
            newErrors.dateCommande = 'La date de commande est obligatoire';
        }

        if (lignes.length === 0) {
            newErrors.lignes = 'Au moins une ligne de commande est requise';
        }

        // Vérifier chaque ligne
        lignes.forEach((ligne, index) => {
            if (!ligne.produitId) {
                newErrors[`ligne_${index}_produit`] = 'Produit obligatoire';
            }
            if (!ligne.quantite || ligne.quantite <= 0) {
                newErrors[`ligne_${index}_quantite`] = 'Quantité invalide';
            }
            if (!ligne.prixUnitaire || ligne.prixUnitaire <= 0) {
                newErrors[`ligne_${index}_prix`] = 'Prix invalide';
            }
        });

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
            const commandeData = {
                ...formData,
                lignes: lignes.map(ligne => ({
                    produitId: ligne.produitId,
                    quantite: ligne.quantite,
                    prixUnitaire: ligne.prixUnitaire,
                    observation: ligne.observation
                })),
                utilisateur: `${user?.prenom} ${user?.nom}`
            };

            await onSubmit(commandeData);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const { sousTotal, tva, totalTTC } = calculerTotaux();

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                    <div className="flex items-center">
                        <ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isEditing ? `Modifier la commande ${commande?.numeroCommande}` : 'Nouvelle commande'}
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Erreur générale */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                    )}

                    {/* Informations générales */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Client */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Client *
                                </label>
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.clientId ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Sélectionner un client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom} - {client.contact}
                                        </option>
                                    ))}
                                </select>
                                {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
                            </div>

                            {/* Date commande */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date commande *
                                </label>
                                <input
                                    type="date"
                                    name="dateCommande"
                                    value={formData.dateCommande}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.dateCommande ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                {errors.dateCommande && <p className="mt-1 text-sm text-red-600">{errors.dateCommande}</p>}
                            </div>

                            {/* Date livraison prévue */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date livraison prévue
                                </label>
                                <input
                                    type="date"
                                    name="dateLivraisonPrevue"
                                    value={formData.dateLivraisonPrevue}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Taux TVA */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Taux TVA (%)
                                </label>
                                <input
                                    type="number"
                                    name="tauxTva"
                                    value={formData.tauxTva}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informations client sélectionné */}
                    {selectedClient && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Informations client</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-blue-800">Contact:</span> {selectedClient.contact}
                                </div>
                                <div>
                                    <span className="font-medium text-blue-800">Téléphone:</span> {selectedClient.telephone}
                                </div>
                                <div>
                                    <span className="font-medium text-blue-800">Email:</span> {selectedClient.email || 'Non renseigné'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Adresse de livraison */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Adresse de livraison</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse complète
                                </label>
                                <textarea
                                    name="adresseLivraison"
                                    value={formData.adresseLivraison}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Adresse de livraison..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact livraison
                                </label>
                                <input
                                    type="text"
                                    name="contactLivraison"
                                    value={formData.contactLivraison}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nom du contact"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone livraison
                                </label>
                                <input
                                    type="tel"
                                    name="telephoneLivraison"
                                    value={formData.telephoneLivraison}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Numéro de téléphone"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lignes de commande */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h4 className="text-md font-medium text-gray-900">Articles commandés</h4>
                            <button
                                type="button"
                                onClick={ajouterLigne}
                                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Ajouter un article
                            </button>
                        </div>

                        {errors.lignes && (
                            <div className="p-4 bg-red-50 border-b border-red-200">
                                <p className="text-sm text-red-600">{errors.lignes}</p>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observation</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {lignes.map((ligne, index) => {
                                    const produit = produitsWithStock.find(p => p.id === parseInt(ligne.produitId));
                                    const stockError = errors[`stock_${ligne.id}`];
                                    const loading = loadingStock[ligne.id];

                                    return (
                                        <tr key={ligne.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <select
                                                    value={ligne.produitId}
                                                    onChange={(e) => updateLigne(ligne.id, 'produitId', e.target.value)}
                                                    className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                        errors[`ligne_${index}_produit`] ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">Sélectionner...</option>
                                                    {produitsWithStock.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.nom} - {p.reference}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[`ligne_${index}_produit`] && (
                                                    <p className="text-xs text-red-600 mt-1">{errors[`ligne_${index}_produit`]}</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {produit ? (
                                                    <div className="text-sm">
                              <span className={`font-medium ${
                                  produit.quantiteEnStock <= 0 ? 'text-red-600' :
                                      produit.quantiteEnStock <= produit.seuil ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {produit.quantiteEnStock}
                              </span>
                                                        <div className="text-xs text-gray-500">
                                                            Seuil: {produit.seuil}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={ligne.quantite}
                                                        onChange={(e) => updateLigne(ligne.id, 'quantite', e.target.value)}
                                                        min="1"
                                                        className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                            errors[`ligne_${index}_quantite`] || stockError ? 'border-red-300' : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {loading && (
                                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                            <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors[`ligne_${index}_quantite`] && (
                                                    <p className="text-xs text-red-600 mt-1">{errors[`ligne_${index}_quantite`]}</p>
                                                )}
                                                {stockError && (
                                                    <p className="text-xs text-red-600 mt-1">{stockError}</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={ligne.prixUnitaire}
                                                    onChange={(e) => updateLigne(ligne.id, 'prixUnitaire', e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                        errors[`ligne_${index}_prix`] ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                />
                                                {errors[`ligne_${index}_prix`] && (
                                                    <p className="text-xs text-red-600 mt-1">{errors[`ligne_${index}_prix`]}</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {ligne.total.toLocaleString()} FCFA
                          </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={ligne.observation}
                                                    onChange={(e) => updateLigne(ligne.id, 'observation', e.target.value)}
                                                    placeholder="Note..."
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => supprimerLigne(ligne.id)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Supprimer cette ligne"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {lignes.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Aucun article ajouté. Cliquez sur "Ajouter un article" pour commencer.</p>
                            </div>
                        )}
                    </div>

                    {/* Totaux */}
                    {lignes.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-end">
                                <div className="w-80">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Sous-total HT:</span>
                                            <span>{sousTotal.toLocaleString()} FCFA</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium">TVA ({formData.tauxTva}%):</span>
                                            <span>{tva.toLocaleString()} FCFA</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                                            <span>Total TTC:</span>
                                            <span>{totalTTC.toLocaleString()} FCFA</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Commentaires ou instructions spéciales..."
                        />
                    </div>

                    {/* Boutons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || lignes.length === 0}
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
                                isEditing ? 'Modifier la commande' : 'Créer la commande'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommandeForm;