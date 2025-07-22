import React, { useState, useEffect } from 'react';
import { Package, User, Calendar, Truck, FileText, Plus, Save, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import clientsService from '../../services/clients';
import produitsService from '../../services/produits';
import livraisonsService from '../../services/livraisons';
import { formatDate } from '../../utils/formatters';

const EntreeLivraisonForm = ({ onClose, onSuccess }) => {
    const { user, getCurrentMagasin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [produits, setProduits] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        date_livraison: new Date().toISOString().split('T')[0],
        transporteur: '',
        vehicule: '',
        chauffeur: '',
        notes: '',
        produits: [{ produit_id: '', quantite: '', prix_unitaire: '' }]
    });
    const [errors, setErrors] = useState({});

    const magasin_id = getCurrentMagasin();

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [clientsRes, produitsRes] = await Promise.all([
                clientsService.getAll(),
                produitsService.getAll()
            ]);
            
            setClients(clientsRes.data || []);
            setProduits(produitsRes.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    };

    const handleInputChange = (e) => {
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
    };

    const handleProduitChange = (index, field, value) => {
        const newProduits = [...formData.produits];
        newProduits[index][field] = value;
        setFormData(prev => ({
            ...prev,
            produits: newProduits
        }));
        
        if (errors[`produits.${index}.${field}`]) {
            setErrors(prev => ({
                ...prev,
                [`produits.${index}.${field}`]: ''
            }));
        }
    };

    const addProduit = () => {
        setFormData(prev => ({
            ...prev,
            produits: [...prev.produits, { produit_id: '', quantite: '', prix_unitaire: '' }]
        }));
    };

    const removeProduit = (index) => {
        if (formData.produits.length > 1) {
            const newProduits = formData.produits.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                produits: newProduits
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.client_id) {
            newErrors.client_id = 'Client requis';
        }

        if (!formData.date_livraison) {
            newErrors.date_livraison = 'Date de livraison requise';
        }

        if (!formData.transporteur) {
            newErrors.transporteur = 'Transporteur requis';
        }

        formData.produits.forEach((produit, index) => {
            if (!produit.produit_id) {
                newErrors[`produits.${index}.produit_id`] = 'Produit requis';
            }
            if (!produit.quantite || produit.quantite <= 0) {
                newErrors[`produits.${index}.quantite`] = 'Quantité requise et > 0';
            }
            if (!produit.prix_unitaire || produit.prix_unitaire <= 0) {
                newErrors[`produits.${index}.prix_unitaire`] = 'Prix unitaire requis et > 0';
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
            const livraisonData = {
                ...formData,
                magasin_id,
                statut: 'reçue',
                type: 'entree'
            };

            await livraisonsService.create(livraisonData);
            
            if (onSuccess) {
                onSuccess();
            }
            
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Erreur lors de la création de la livraison:', error);
            setErrors({
                general: 'Erreur lors de l\'enregistrement de la livraison'
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedClient = clients.find(c => c.id === parseInt(formData.client_id));
    const calculateTotal = () => {
        return formData.produits.reduce((total, produit) => {
            return total + (parseFloat(produit.quantite || 0) * parseFloat(produit.prix_unitaire || 0));
        }, 0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <Package className="mr-2" size={24} />
                            Saisie Entrée Livraison
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="p-2"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="inline mr-1" size={16} />
                                    Client *
                                </label>
                                <select
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.client_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                >
                                    <option value="">Sélectionner un client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.nom} - {client.email}
                                        </option>
                                    ))}
                                </select>
                                {errors.client_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="inline mr-1" size={16} />
                                    Date de livraison *
                                </label>
                                <input
                                    type="date"
                                    name="date_livraison"
                                    value={formData.date_livraison}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.date_livraison ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.date_livraison && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date_livraison}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Truck className="inline mr-1" size={16} />
                                    Transporteur *
                                </label>
                                <input
                                    type="text"
                                    name="transporteur"
                                    value={formData.transporteur}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${
                                        errors.transporteur ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nom du transporteur"
                                    required
                                />
                                {errors.transporteur && (
                                    <p className="mt-1 text-sm text-red-600">{errors.transporteur}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Véhicule
                                </label>
                                <input
                                    type="text"
                                    name="vehicule"
                                    value={formData.vehicule}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Immatriculation"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chauffeur
                                </label>
                                <input
                                    type="text"
                                    name="chauffeur"
                                    value={formData.chauffeur}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Nom du chauffeur"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Produits livrés
                                </h3>
                                <Button
                                    type="button"
                                    onClick={addProduit}
                                    className="flex items-center"
                                >
                                    <Plus className="mr-1" size={16} />
                                    Ajouter
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {formData.produits.map((produit, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Produit *
                                                </label>
                                                <select
                                                    value={produit.produit_id}
                                                    onChange={(e) => handleProduitChange(index, 'produit_id', e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        errors[`produits.${index}.produit_id`] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    required
                                                >
                                                    <option value="">Sélectionner un produit</option>
                                                    {produits.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.nom} - {p.reference}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors[`produits.${index}.produit_id`] && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors[`produits.${index}.produit_id`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quantité *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={produit.quantite}
                                                    onChange={(e) => handleProduitChange(index, 'quantite', e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        errors[`produits.${index}.quantite`] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Quantité"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                                {errors[`produits.${index}.quantite`] && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors[`produits.${index}.quantite`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Prix unitaire *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={produit.prix_unitaire}
                                                    onChange={(e) => handleProduitChange(index, 'prix_unitaire', e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-md ${
                                                        errors[`produits.${index}.prix_unitaire`] ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Prix"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                                {errors[`produits.${index}.prix_unitaire`] && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors[`produits.${index}.prix_unitaire`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {formData.produits.length > 1 && (
                                            <div className="flex justify-end mt-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => removeProduit(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="inline mr-1" size={16} />
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Notes additionnelles..."
                            />
                        </div>

                        {selectedClient && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Informations client</h4>
                                <div className="text-sm text-blue-800">
                                    <p><strong>Nom:</strong> {selectedClient.nom}</p>
                                    <p><strong>Email:</strong> {selectedClient.email}</p>
                                    {selectedClient.telephone && (
                                        <p><strong>Téléphone:</strong> {selectedClient.telephone}</p>
                                    )}
                                    {selectedClient.adresse && (
                                        <p><strong>Adresse:</strong> {selectedClient.adresse}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-green-900">
                                    Total de la livraison
                                </span>
                                <span className="text-xl font-bold text-green-900">
                                    {calculateTotal().toLocaleString('fr-FR')} FCFA
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2" size={16} />
                                        Enregistrer
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default EntreeLivraisonForm;