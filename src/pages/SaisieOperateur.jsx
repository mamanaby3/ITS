import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, Users, Calendar, Save, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { useMagasins } from '../hooks/useMagasins';

const SaisieOperateur = () => {
    const { user } = useAuth();
    const { magasins } = useMagasins();
    const [activeTab, setActiveTab] = useState('entree');
    const [loading, setLoading] = useState(false);
    
    // Clients de démonstration
    const [clients] = useState([
        { id: 1, nom: 'SENAC', code: 'CL-001' },
        { id: 2, nom: 'Grands Moulins de Dakar', code: 'CL-002' },
        { id: 3, nom: 'SODEFITEX', code: 'CL-003' },
        { id: 4, nom: 'NMA Sanders', code: 'CL-004' },
        { id: 5, nom: 'SEDIMA', code: 'CL-005' }
    ]);
    
    // Produits disponibles
    const [produits] = useState([
        { id: 1, nom: 'Maïs jaune', unite: 'tonnes' },
        { id: 2, nom: 'Soja', unite: 'tonnes' },
        { id: 3, nom: 'Blé tendre', unite: 'tonnes' },
        { id: 4, nom: 'Riz parfumé', unite: 'tonnes' },
        { id: 5, nom: 'Mil', unite: 'tonnes' }
    ]);

    // Formulaire d'entrée
    const [entreeForm, setEntreeForm] = useState({
        date: new Date().toISOString().split('T')[0],
        client: '',
        produit: '',
        tonnage: '',
        magasin: '',
        reference: '',
        observations: ''
    });

    // Formulaire de sortie
    const [sortieForm, setSortieForm] = useState({
        date: new Date().toISOString().split('T')[0],
        client: '',
        produit: '',
        tonnage: '',
        magasin: '',
        bonLivraison: '',
        chauffeur: '',
        matricule: '',
        observations: ''
    });

    // Stock disponible pour validation
    const [stockDisponible, setStockDisponible] = useState(null);

    // Historique récent
    const [historique, setHistorique] = useState([
        {
            id: 1,
            type: 'entree',
            date: new Date().toISOString(),
            client: 'SENAC',
            produit: 'Maïs jaune',
            tonnage: 500,
            magasin: 'Entrepôt Principal Port',
            operateur: 'Moussa Ndiaye'
        },
        {
            id: 2,
            type: 'sortie',
            date: new Date(Date.now() - 86400000).toISOString(),
            client: 'Grands Moulins de Dakar',
            produit: 'Blé tendre',
            tonnage: 250,
            magasin: 'Entrepôt Zone Industrielle',
            operateur: 'Fatou Sow',
            bonLivraison: 'BL-2024-156'
        }
    ]);

    // Vérifier le stock disponible lors du changement de produit/client/magasin pour les sorties
    useEffect(() => {
        if (activeTab === 'sortie' && sortieForm.client && sortieForm.produit && sortieForm.magasin) {
            // Simuler la vérification du stock
            // En production, ceci ferait un appel API
            setStockDisponible(Math.floor(Math.random() * 1000) + 100);
        }
    }, [sortieForm.client, sortieForm.produit, sortieForm.magasin, activeTab]);

    const handleEntreeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Validation
            if (!entreeForm.client || !entreeForm.produit || !entreeForm.tonnage || !entreeForm.magasin) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Simuler l'enregistrement
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Ajouter à l'historique
            const nouvelleEntree = {
                id: Date.now(),
                type: 'entree',
                date: new Date().toISOString(),
                client: clients.find(c => c.id === parseInt(entreeForm.client))?.nom,
                produit: produits.find(p => p.id === parseInt(entreeForm.produit))?.nom,
                tonnage: parseFloat(entreeForm.tonnage),
                magasin: entreeForm.magasin,
                operateur: `${user.prenom} ${user.nom}`,
                reference: entreeForm.reference
            };
            
            setHistorique([nouvelleEntree, ...historique]);
            
            // Réinitialiser le formulaire
            setEntreeForm({
                date: new Date().toISOString().split('T')[0],
                client: '',
                produit: '',
                tonnage: '',
                magasin: '',
                reference: '',
                observations: ''
            });
            
            alert('Entrée enregistrée avec succès !');
        } catch (error) {
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    const handleSortieSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Validation
            if (!sortieForm.client || !sortieForm.produit || !sortieForm.tonnage || !sortieForm.magasin || !sortieForm.bonLivraison) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Vérifier le stock disponible
            if (parseFloat(sortieForm.tonnage) > stockDisponible) {
                alert(`Stock insuffisant ! Disponible: ${stockDisponible} tonnes`);
                return;
            }

            // Simuler l'enregistrement
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Ajouter à l'historique
            const nouvelleSortie = {
                id: Date.now(),
                type: 'sortie',
                date: new Date().toISOString(),
                client: clients.find(c => c.id === parseInt(sortieForm.client))?.nom,
                produit: produits.find(p => p.id === parseInt(sortieForm.produit))?.nom,
                tonnage: parseFloat(sortieForm.tonnage),
                magasin: sortieForm.magasin,
                operateur: `${user.prenom} ${user.nom}`,
                bonLivraison: sortieForm.bonLivraison,
                chauffeur: sortieForm.chauffeur,
                matricule: sortieForm.matricule
            };
            
            setHistorique([nouvelleSortie, ...historique]);
            
            // Réinitialiser le formulaire
            setSortieForm({
                date: new Date().toISOString().split('T')[0],
                client: '',
                produit: '',
                tonnage: '',
                magasin: '',
                bonLivraison: '',
                chauffeur: '',
                matricule: '',
                observations: ''
            });
            
            alert('Sortie enregistrée avec succès !');
        } catch (error) {
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white shadow-sm rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Saisie des Mouvements</h1>
                <p className="text-sm text-gray-600 mt-1">Enregistrement des entrées et sorties par client</p>
            </div>

            {/* Onglets */}
            <div className="bg-white shadow-sm rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('entree')}
                            className={`py-2 px-6 border-b-2 font-medium text-sm ${
                                activeTab === 'entree'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Entrées (Réception)</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('sortie')}
                            className={`py-2 px-6 border-b-2 font-medium text-sm ${
                                activeTab === 'sortie'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <Minus className="h-4 w-4" />
                                <span>Sorties (Livraison)</span>
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Formulaire d'entrée */}
                    {activeTab === 'entree' && (
                        <form onSubmit={handleEntreeSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de réception *
                                    </label>
                                    <input
                                        type="date"
                                        value={entreeForm.date}
                                        onChange={(e) => setEntreeForm({...entreeForm, date: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client *
                                    </label>
                                    <select
                                        value={entreeForm.client}
                                        onChange={(e) => setEntreeForm({...entreeForm, client: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.nom} ({client.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Produit *
                                    </label>
                                    <select
                                        value={entreeForm.produit}
                                        onChange={(e) => setEntreeForm({...entreeForm, produit: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {produits.map(produit => (
                                            <option key={produit.id} value={produit.id}>
                                                {produit.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tonnage *
                                    </label>
                                    <input
                                        type="number"
                                        value={entreeForm.tonnage}
                                        onChange={(e) => setEntreeForm({...entreeForm, tonnage: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Magasin de destination *
                                    </label>
                                    <select
                                        value={entreeForm.magasin}
                                        onChange={(e) => setEntreeForm({...entreeForm, magasin: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un magasin</option>
                                        {magasins?.map(magasin => (
                                            <option key={magasin.id} value={magasin.nom}>
                                                {magasin.nom} - {magasin.ville}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Référence document
                                    </label>
                                    <input
                                        type="text"
                                        value={entreeForm.reference}
                                        onChange={(e) => setEntreeForm({...entreeForm, reference: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: BL-2024-001"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observations
                                </label>
                                <textarea
                                    value={entreeForm.observations}
                                    onChange={(e) => setEntreeForm({...entreeForm, observations: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Notes additionnelles..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="flex items-center space-x-2"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>Enregistrer l'entrée</span>
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Formulaire de sortie */}
                    {activeTab === 'sortie' && (
                        <form onSubmit={handleSortieSubmit} className="space-y-6">
                            {/* Alerte stock disponible */}
                            {stockDisponible !== null && sortieForm.client && sortieForm.produit && sortieForm.magasin && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">
                                            Stock disponible: {stockDisponible} tonnes
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de livraison *
                                    </label>
                                    <input
                                        type="date"
                                        value={sortieForm.date}
                                        onChange={(e) => setSortieForm({...sortieForm, date: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client *
                                    </label>
                                    <select
                                        value={sortieForm.client}
                                        onChange={(e) => setSortieForm({...sortieForm, client: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.nom} ({client.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Produit *
                                    </label>
                                    <select
                                        value={sortieForm.produit}
                                        onChange={(e) => setSortieForm({...sortieForm, produit: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {produits.map(produit => (
                                            <option key={produit.id} value={produit.id}>
                                                {produit.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tonnage *
                                    </label>
                                    <input
                                        type="number"
                                        value={sortieForm.tonnage}
                                        onChange={(e) => setSortieForm({...sortieForm, tonnage: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                        min="0"
                                        max={stockDisponible || undefined}
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Magasin d'origine *
                                    </label>
                                    <select
                                        value={sortieForm.magasin}
                                        onChange={(e) => setSortieForm({...sortieForm, magasin: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Sélectionner un magasin</option>
                                        {magasins?.map(magasin => (
                                            <option key={magasin.id} value={magasin.nom}>
                                                {magasin.nom} - {magasin.ville}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        N° Bon de livraison *
                                    </label>
                                    <input
                                        type="text"
                                        value={sortieForm.bonLivraison}
                                        onChange={(e) => setSortieForm({...sortieForm, bonLivraison: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: BL-2024-001"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du chauffeur
                                    </label>
                                    <input
                                        type="text"
                                        value={sortieForm.chauffeur}
                                        onChange={(e) => setSortieForm({...sortieForm, chauffeur: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nom complet"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Matricule véhicule
                                    </label>
                                    <input
                                        type="text"
                                        value={sortieForm.matricule}
                                        onChange={(e) => setSortieForm({...sortieForm, matricule: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: DK-1234-AB"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observations
                                </label>
                                <textarea
                                    value={sortieForm.observations}
                                    onChange={(e) => setSortieForm({...sortieForm, observations: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Notes additionnelles..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="flex items-center space-x-2"
                                    variant="primary"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>Enregistrer la sortie</span>
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Historique récent */}
            <Card>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Historique récent</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {historique.slice(0, 5).map((mouvement) => (
                            <div key={mouvement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-full ${
                                        mouvement.type === 'entree' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        {mouvement.type === 'entree' ? (
                                            <Plus className={`h-5 w-5 text-green-600`} />
                                        ) : (
                                            <Minus className={`h-5 w-5 text-red-600`} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {mouvement.client} - {mouvement.produit}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(mouvement.date)} • {mouvement.magasin} • Par {mouvement.operateur}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-semibold ${
                                        mouvement.type === 'entree' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {mouvement.type === 'entree' ? '+' : '-'}{mouvement.tonnage} tonnes
                                    </div>
                                    {mouvement.bonLivraison && (
                                        <div className="text-sm text-gray-500">{mouvement.bonLivraison}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SaisieOperateur;