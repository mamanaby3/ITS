import React, { useState, useEffect } from 'react';
import { Ship, Package, MapPin, Calendar, AlertCircle, CheckCircle, Clock, Plus, Save, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { formatDate } from '../utils/formatters';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import naviresService from '../services/navires';
import { useMagasins } from '../hooks/useMagasins';
import { useFilters } from '../hooks/useFilters';
import ActiveFilters from '../components/layout/ActiveFilters';
import FilteredStats from '../components/stats/FilteredStats';

const ReceptionNavires = () => {
    const navigate = useNavigate();
    const { hasPermission, user } = usePermissions();
    const canReceiveShips = hasPermission('navires.reception');
    const canDispatch = hasPermission('navires.dispatch');
    const { magasins, loading: loadingMagasins } = useMagasins();
    const { filters } = useFilters();

    const [navires, setNavires] = useState([]);
    const [selectedNavire, setSelectedNavire] = useState(null);
    const [showReceptionForm, setShowReceptionForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingNavires, setLoadingNavires] = useState(true);
    const [error, setError] = useState(null);

    // Charger les navires depuis l'API
    const loadNavires = async () => {
        try {
            setLoadingNavires(true);
            setError(null);
            const response = await naviresService.getAll(filters);
            
            // Adapter les données de l'API au format attendu par le frontend
            const naviresFormated = response.data.map(navire => ({
                id: navire.id,
                nom: navire.nom_navire,
                imo: navire.numero_imo,
                dateArrivee: navire.date_arrivee,
                port: navire.port,
                statut: navire.statut,
                numeroConnaissement: navire.numero_connaissement,
                agentMaritime: navire.agent_maritime,
                dateReception: navire.date_reception,
                receptionPar: navire.reception_nom ? `${navire.reception_prenom} ${navire.reception_nom}` : '',
                observations: navire.observations,
                cargaison: (navire.cargaison || []).map(cargo => ({
                    ...cargo,
                    produit: cargo.produit_nom || cargo.produit,
                    quantite: cargo.quantite_recue || cargo.quantite_declaree || cargo.quantite || 0,
                    unite: cargo.unite || 'tonnes'
                })),
                dispatching: navire.dispatching || []
            }));
            
            setNavires(naviresFormated);
        } catch (error) {
            console.error('Erreur chargement navires:', error);
            setError('Impossible de charger les navires');
        } finally {
            setLoadingNavires(false);
        }
    };

    useEffect(() => {
        loadNavires();
    }, [filters]);

    // Formulaire de réception complet
    const [receptionForm, setReceptionForm] = useState({
        // Informations du navire
        nomNavire: '',
        numeroIMO: '',
        pavillon: '',
        portChargement: '',
        portDechargement: 'Dakar',
        dateArriveePrevue: new Date().toISOString().split('T')[0],
        dateArriveeReelle: new Date().toISOString().split('T')[0],
        dateArrivee: new Date().toISOString().split('T')[0],
        port: 'Port de Dakar',
        
        // Détails de la cargaison
        cargaison: [
            {
                produit: '',
                quantite: '',
                unite: 'tonnes',
                origine: ''
            }
        ],
        
        // Vérifications
        documentsVerifies: false,
        qualiteVerifiee: false,
        quantiteConfirmee: false,
        
        // Autres informations
        numeroConnaissement: '',
        agentMaritime: '',
        observations: ''
    });


    const handleNewReception = () => {
        setReceptionForm({
            nomNavire: '',
            numeroIMO: '',
            pavillon: '',
            portChargement: '',
            portDechargement: 'Dakar',
            dateArriveePrevue: new Date().toISOString().split('T')[0],
            dateArriveeReelle: new Date().toISOString().split('T')[0],
            dateArrivee: new Date().toISOString().split('T')[0],
            port: 'Port de Dakar',
            cargaison: [{
                produit: '',
                quantite: '',
                unite: 'tonnes',
                origine: ''
            }],
            documentsVerifies: false,
            qualiteVerifiee: false,
            quantiteConfirmee: false,
            numeroConnaissement: '',
            agentMaritime: '',
            observations: ''
        });
        setShowReceptionForm(true);
    };

    const handleDispatch = (navire) => {
        // Rediriger vers la page de dispatching avec les données du navire
        navigate('/dispatch-navire', { 
            state: { 
                navire: navire,
                fromReception: true 
            } 
        });
    };

    const confirmReception = async () => {
        setLoading(true);
        try {
            // Validation du formulaire
            if (!receptionForm.nomNavire || !receptionForm.numeroIMO || 
                receptionForm.cargaison.some(c => !c.produit || !c.quantite || !c.origine)) {
                alert('Veuillez remplir tous les champs obligatoires');
                setLoading(false);
                return;
            }

            // Appel API réel
            const response = await naviresService.createReception(receptionForm);
            
            if (response.success) {
                // Recharger la liste des navires
                await loadNavires();
                
                setShowReceptionForm(false);
                alert('Navire réceptionné avec succès !');
                
                // Réinitialiser le formulaire
                setReceptionForm({
                    nomNavire: '',
                    numeroIMO: '',
                    dateArrivee: new Date().toISOString().split('T')[0],
                    port: 'Port de Dakar',
                    cargaison: [{
                        produit: '',
                        quantite: '',
                        unite: 'tonnes',
                        origine: ''
                    }],
                    documentsVerifies: false,
                    qualiteVerifiee: false,
                    quantiteConfirmee: false,
                    numeroConnaissement: '',
                    agentMaritime: '',
                    observations: ''
                });
            }
        } catch (error) {
            console.error('Erreur réception:', error);
            alert(error.response?.data?.error || 'Erreur lors de la réception');
        } finally {
            setLoading(false);
        }
    };


    // Ajouter une ligne de cargaison
    const addCargaisonLine = () => {
        setReceptionForm({
            ...receptionForm,
            cargaison: [...receptionForm.cargaison, {
                produit: '',
                quantite: '',
                unite: 'tonnes',
                origine: ''
            }]
        });
    };

    // Supprimer une ligne de cargaison
    const removeCargaisonLine = (index) => {
        if (receptionForm.cargaison.length > 1) {
            const newCargaison = receptionForm.cargaison.filter((_, i) => i !== index);
            setReceptionForm({ ...receptionForm, cargaison: newCargaison });
        }
    };

    // Mettre à jour une ligne de cargaison
    const updateCargaisonLine = (index, field, value) => {
        const newCargaison = [...receptionForm.cargaison];
        newCargaison[index][field] = value;
        setReceptionForm({ ...receptionForm, cargaison: newCargaison });
    };

    const getStatutBadge = (statut) => {
        const badges = {
            en_attente: { color: 'yellow', label: 'En attente', icon: Clock },
            receptionne: { color: 'blue', label: 'Réceptionné', icon: CheckCircle },
            dispatche: { color: 'green', label: 'Dispatché', icon: CheckCircle }
        };
        const badge = badges[statut] || badges.en_attente;
        const Icon = badge.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.label}
            </span>
        );
    };

    if (!canReceiveShips) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Ship className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-semibold text-gray-900">Réception des Navires</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(new Date())}</span>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleNewReception}
                            className="flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nouvelle réception</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filtres actifs */}
            <ActiveFilters />

            {/* Statistiques filtrées */}
            <FilteredStats />

            {/* Affichage des erreurs */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* État de chargement */}
            {loadingNavires ? (
                <div className="bg-white shadow-sm rounded-lg p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des navires...</p>
                </div>
            ) : navires.length === 0 ? (
                <div className="bg-white shadow-sm rounded-lg p-12 text-center">
                    <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun navire enregistré</p>
                    <p className="text-sm text-gray-500 mt-2">Cliquez sur "Nouvelle réception" pour commencer</p>
                </div>
            ) : (
                /* Liste des navires */
                <div className="grid gap-6">
                    {navires.map(navire => (
                    <Card key={navire.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Ship className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{navire.nom}</h3>
                                    <p className="text-sm text-gray-600">{navire.imo}</p>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm text-gray-500">
                                            <MapPin className="inline h-3 w-3 mr-1" />
                                            {navire.port}
                                        </p>
                                        {navire.numeroConnaissement && (
                                            <p className="text-sm text-gray-500">
                                                Connaissement: {navire.numeroConnaissement}
                                            </p>
                                        )}
                                        {navire.agentMaritime && (
                                            <p className="text-sm text-gray-500">
                                                Agent: {navire.agentMaritime}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                {getStatutBadge(navire.statut)}
                                <p className="text-sm text-gray-500 mt-2">
                                    Arrivée: {formatDate(navire.dateArrivee, 'dd/MM/yyyy HH:mm')}
                                </p>
                                {navire.dateReception && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Réceptionné: {formatDate(navire.dateReception, 'dd/MM/yyyy HH:mm')}
                                    </p>
                                )}
                                {navire.receptionPar && (
                                    <p className="text-sm text-gray-500">
                                        Par: {navire.receptionPar}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Cargaison */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Cargaison</h4>
                            <div className="space-y-2">
                                {navire.cargaison.map((cargo, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{cargo.produit}</span>
                                            <span className="text-gray-500">({cargo.origine})</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {(cargo.quantite || 0).toLocaleString()} {cargo.unite || 'tonnes'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dispatching (si applicable) */}
                        {navire.dispatching && navire.dispatching.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-green-700 mb-3">Distribution</h4>
                                <div className="space-y-1">
                                    {navire.dispatching.map((dispatch, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-green-700">
                                                    {dispatch.magasin_nom || dispatch.client_nom || 'Non spécifié'}
                                                </span>
                                                {dispatch.client_nom && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Client</span>
                                                )}
                                            </div>
                                            <span className="font-medium text-green-900">
                                                {(dispatch.quantite_chargee || 0).toLocaleString()} tonnes
                                                {dispatch.produit_nom && <span className="text-xs ml-1">({dispatch.produit_nom})</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-2">
                            {navire.statut === 'receptionne' && canDispatch && (
                                <Button
                                    variant="success"
                                    onClick={() => handleDispatch(navire)}
                                    className="flex items-center space-x-2"
                                >
                                    <Package className="h-4 w-4" />
                                    <span>Dispatcher</span>
                                </Button>
                            )}
                        </div>
                    </Card>
                    ))}
                </div>
            )}

            {/* Modal de réception */}
            <Modal
                isOpen={showReceptionForm}
                onClose={() => setShowReceptionForm(false)}
                size="xl"
            >
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Anchor className="h-8 w-8 text-blue-600" />
                        <h2 className="text-xl font-semibold">Nouvelle réception de navire</h2>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); confirmReception(); }} className="space-y-6">
                        {/* Informations du navire */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du navire</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du navire *
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.nomNavire}
                                        onChange={(e) => setReceptionForm({...receptionForm, nomNavire: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: MV Atlantic Carrier"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Numéro IMO *
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.numeroIMO}
                                        onChange={(e) => setReceptionForm({...receptionForm, numeroIMO: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: IMO 9234567"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date d'arrivée *
                                    </label>
                                    <input
                                        type="date"
                                        value={receptionForm.dateArrivee}
                                        onChange={(e) => setReceptionForm({...receptionForm, dateArrivee: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Port de déchargement
                                    </label>
                                    <select
                                        value={receptionForm.port}
                                        onChange={(e) => setReceptionForm({...receptionForm, port: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Port de Dakar">Port de Dakar</option>
                                        <option value="Port de Kaolack">Port de Kaolack</option>
                                        <option value="Port de Ziguinchor">Port de Ziguinchor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pavillon
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.pavillon}
                                        onChange={(e) => setReceptionForm({...receptionForm, pavillon: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Libéria, Panama..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Port de chargement
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.portChargement}
                                        onChange={(e) => setReceptionForm({...receptionForm, portChargement: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Port de Santos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date arrivée prévue
                                    </label>
                                    <input
                                        type="date"
                                        value={receptionForm.dateArriveePrevue}
                                        onChange={(e) => setReceptionForm({...receptionForm, dateArriveePrevue: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date arrivée réelle
                                    </label>
                                    <input
                                        type="date"
                                        value={receptionForm.dateArriveeReelle}
                                        onChange={(e) => setReceptionForm({...receptionForm, dateArriveeReelle: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        N° Connaissement
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.numeroConnaissement}
                                        onChange={(e) => setReceptionForm({...receptionForm, numeroConnaissement: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: BL/2024/001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Agent maritime
                                    </label>
                                    <input
                                        type="text"
                                        value={receptionForm.agentMaritime}
                                        onChange={(e) => setReceptionForm({...receptionForm, agentMaritime: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom de l'agent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Détails de la cargaison */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Détails de la cargaison</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addCargaisonLine}
                                    className="flex items-center space-x-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Ajouter</span>
                                </Button>
                            </div>
                            
                            {receptionForm.cargaison.map((cargo, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            value={cargo.produit}
                                            onChange={(e) => updateCargaisonLine(index, 'produit', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Produit *"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={cargo.quantite}
                                            onChange={(e) => updateCargaisonLine(index, 'quantite', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Quantité *"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={cargo.origine}
                                            onChange={(e) => updateCargaisonLine(index, 'origine', e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Origine *"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCargaisonLine(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vérifications */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Vérifications obligatoires</h3>
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={receptionForm.documentsVerifies}
                                    onChange={(e) => setReceptionForm({...receptionForm, documentsVerifies: e.target.checked})}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Documents vérifiés (connaissement, certificats, etc.)</span>
                            </label>
                            
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={receptionForm.qualiteVerifiee}
                                    onChange={(e) => setReceptionForm({...receptionForm, qualiteVerifiee: e.target.checked})}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Qualité vérifiée et conforme</span>
                            </label>
                            
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={receptionForm.quantiteConfirmee}
                                    onChange={(e) => setReceptionForm({...receptionForm, quantiteConfirmee: e.target.checked})}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Quantité confirmée par pesage</span>
                            </label>
                        </div>

                        {/* Observations */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observations
                            </label>
                            <textarea
                                value={receptionForm.observations}
                                onChange={(e) => setReceptionForm({...receptionForm, observations: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Notes additionnelles sur la réception..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowReceptionForm(false)}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={!receptionForm.documentsVerifies || !receptionForm.qualiteVerifiee || !receptionForm.quantiteConfirmee}
                                className="flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>Enregistrer la réception</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default ReceptionNavires;
