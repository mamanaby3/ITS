// src/components/clients/ClientForm.jsx
import { useState, useEffect } from 'react';
import clientsService from '../../services/clients';
import { XMarkIcon, UsersIcon } from '../ui/SimpleIcons';

const ClientForm = ({ client = null, onSubmit, onCancel, isEditing = false }) => {
    const [formData, setFormData] = useState({
        nom: '',
        contact: '',
        type: '',
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        region: '',
        codePostal: '',
        activite: '',
        observation: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Si on édite un client, remplir le formulaire
        if (isEditing && client) {
            setFormData({
                nom: client.nom || '',
                contact: client.contact || '',
                type: client.type || '',
                telephone: client.telephone || '',
                email: client.email || '',
                adresse: client.adresse || '',
                ville: client.ville || '',
                region: client.region || '',
                codePostal: client.codePostal || '',
                activite: client.activite || '',
                observation: client.observation || ''
            });
        }
    }, [client, isEditing]);

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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est obligatoire';
        }

        if (!formData.contact.trim()) {
            newErrors.contact = 'Le nom du contact est obligatoire';
        }

        if (!formData.type) {
            newErrors.type = 'Le type de client est obligatoire';
        }

        if (!formData.telephone.trim()) {
            newErrors.telephone = 'Le téléphone est obligatoire';
        } else if (formData.telephone.length < 8) {
            newErrors.telephone = 'Le téléphone doit contenir au moins 8 caractères';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'L\'adresse email n\'est pas valide';
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
            await onSubmit(formData);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    const regions = [
        'Dakar',
        'Thiès',
        'Saint-Louis',
        'Diourbel',
        'Louga',
        'Fatick',
        'Kaolack',
        'Kolda',
        'Ziguinchor',
        'Tambacounda',
        'Kaffrine',
        'Kédougou',
        'Matam',
        'Sédhiou'
    ];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <UsersIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isEditing ? 'Modifier le client' : 'Nouveau client'}
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

                    {/* Informations de base */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nom */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom de l'entreprise / Particulier *
                                </label>
                                <input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.nom ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Ex: Entreprise ABC ou Amadou Diallo"
                                />
                                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Personne de contact *
                                </label>
                                <input
                                    type="text"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.contact ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nom du responsable ou contact principal"
                                />
                                {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de client *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.type ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Sélectionner un type</option>
                                    <option value="particulier">Particulier</option>
                                    <option value="entreprise">Entreprise</option>
                                    <option value="administration">Administration</option>
                                </select>
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                            </div>

                            {/* Activité */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Secteur d'activité
                                </label>
                                <input
                                    type="text"
                                    name="activite"
                                    value={formData.activite}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Commerce, IT, Agriculture..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Coordonnées</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Téléphone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone *
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.telephone ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Ex: 77 123 45 67"
                                />
                                {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="exemple@email.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Adresse</h4>

                        <div className="space-y-4">
                            {/* Adresse complète */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Adresse complète
                                </label>
                                <textarea
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Adresse détaillée..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Ville */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ville
                                    </label>
                                    <input
                                        type="text"
                                        name="ville"
                                        value={formData.ville}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Dakar"
                                    />
                                </div>

                                {/* Région */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Région
                                    </label>
                                    <select
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Sélectionner une région</option>
                                        {regions.map((region) => (
                                            <option key={region} value={region}>
                                                {region}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Code postal */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Code postal
                                    </label>
                                    <input
                                        type="text"
                                        name="codePostal"
                                        value={formData.codePostal}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: 10000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observations
                        </label>
                        <textarea
                            name="observation"
                            value={formData.observation}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Notes ou commentaires sur le client..."
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

export default ClientForm;