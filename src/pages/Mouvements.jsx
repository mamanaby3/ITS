import React, { useState, useEffect } from 'react';
import { 
    ArrowDown, 
    ArrowUp, 
    ArrowLeftRight,
    Filter,
    Download,
    Clock,
    Truck,
    Ship,
    Package
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import { STOCK_MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../utils/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';
import toast from 'react-hot-toast';

const Mouvements = () => {
    const { hasPermission, user } = usePermissions();
    const canExportMovements = hasPermission('stock.export');
    
    const [mouvements, setMouvements] = useState([]);
    const [filteredMouvements, setFilteredMouvements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [magasins, setMagasins] = useState([]);
    
    // Filtres
    const [filters, setFilters] = useState({
        type: '',
        magasin: '',
        produit: '',
        dateDebut: '', // Pas de filtre de date par défaut
        dateFin: '',
        recherche: ''
    });
    
    const [showFilters, setShowFilters] = useState(false);

    // Charger les mouvements depuis l'API
    useEffect(() => {
        loadMagasins();
        loadMouvements();
    }, [filters.dateDebut, filters.dateFin]);
    
    const loadMagasins = async () => {
        try {
            const response = await api.get('/magasins');
            if (response.data) {
                setMagasins(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement magasins:', error);
        }
    };

    const loadMouvements = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                date_debut: filters.dateDebut,
                date_fin: filters.dateFin,
                limit: 500
            });

            const response = await api.get(`/mouvements?${params}`);
            
            if (response.success && response.data) {
                setMouvements(response.data);
                setFilteredMouvements(response.data);
            } else {
                setMouvements([]);
                setFilteredMouvements([]);
            }
        } catch (error) {
            console.error('Erreur chargement mouvements:', error);
            toast.error('Erreur lors du chargement des mouvements');
            setMouvements([]);
            setFilteredMouvements([]);
        }
        setLoading(false);
    };

    // Appliquer les filtres
    useEffect(() => {
        let filtered = [...mouvements];

        if (filters.type) {
            filtered = filtered.filter(m => m.type_mouvement === filters.type);
        }

        if (filters.magasin) {
            filtered = filtered.filter(m => 
                m.magasin_origine === filters.magasin || 
                m.magasin_destination === filters.magasin
            );
        }

        if (filters.produit) {
            filtered = filtered.filter(m => 
                m.produit.toLowerCase().includes(filters.produit.toLowerCase())
            );
        }

        if (filters.dateDebut) {
            filtered = filtered.filter(m => 
                new Date(m.date_mouvement) >= new Date(filters.dateDebut)
            );
        }

        if (filters.dateFin) {
            filtered = filtered.filter(m => 
                new Date(m.date_mouvement) <= new Date(filters.dateFin + 'T23:59:59')
            );
        }

        if (filters.recherche) {
            const search = filters.recherche.toLowerCase();
            filtered = filtered.filter(m => 
                m.reference_document.toLowerCase().includes(search) ||
                m.produit.toLowerCase().includes(search) ||
                m.operateur.toLowerCase().includes(search) ||
                (m.nom_navire && m.nom_navire.toLowerCase().includes(search)) ||
                (m.observations && m.observations.toLowerCase().includes(search))
            );
        }

        setFilteredMouvements(filtered);
    }, [filters, mouvements]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'entree':
                return <ArrowDown className="h-5 w-5" />;
            case 'sortie':
                return <ArrowUp className="h-5 w-5" />;
            case 'transfert':
                return <ArrowLeftRight className="h-5 w-5" />;
            case 'dispatch':
                return <Truck className="h-5 w-5" />;
            default:
                return <Clock className="h-5 w-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'entree':
                return 'green';
            case 'sortie':
                return 'red';
            case 'transfert':
                return 'blue';
            case 'ajustement':
                return 'yellow';
            case 'dispatch':
                return 'purple';
            default:
                return 'gray';
        }
    };

    const exportMovements = () => {
        // Logique d'export
        console.log('Export des mouvements');
    };

    const resetFilters = () => {
        setFilters({
            type: '',
            magasin: '',
            produit: '',
            dateDebut: '',
            dateFin: '',
            recherche: ''
        });
    };

    // Calculer les statistiques
    const stats = {
        totalMouvements: filteredMouvements.length,
        entrees: filteredMouvements.filter(m => m.type_mouvement === 'entree').length,
        sorties: filteredMouvements.filter(m => m.type_mouvement === 'sortie').length,
        dispatcher: filteredMouvements.filter(m => m.type_mouvement === 'dispatch').length
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Mouvements de Stock</h1>
                        <p className="text-sm text-gray-600 mt-1">Traçabilité complète des opérations</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2"
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filtrer</span>
                        </Button>
                        {canExportMovements && (
                            <Button
                                variant="primary"
                                onClick={exportMovements}
                                className="flex items-center space-x-2"
                            >
                                <Download className="h-4 w-4" />
                                <span>Exporter</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.totalMouvements}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-full">
                            <Clock className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Entrées</p>
                            <p className="text-2xl font-semibold text-green-600">{stats.entrees}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <ArrowDown className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Sorties</p>
                            <p className="text-2xl font-semibold text-red-600">{stats.sorties}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <ArrowUp className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Dispatcher</p>
                            <p className="text-2xl font-semibold text-purple-600">{stats.dispatcher}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Truck className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtres */}
            {showFilters && (
                <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({...filters, type: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous</option>
                                {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Magasin
                            </label>
                            <select
                                value={filters.magasin}
                                onChange={(e) => setFilters({...filters, magasin: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous</option>
                                {magasins.map(magasin => (
                                    <option key={magasin.id} value={magasin.nom}>
                                        {magasin.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Produit
                            </label>
                            <input
                                type="text"
                                value={filters.produit}
                                onChange={(e) => setFilters({...filters, produit: e.target.value})}
                                placeholder="Rechercher..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date début
                            </label>
                            <input
                                type="date"
                                value={filters.dateDebut}
                                onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date fin
                            </label>
                            <input
                                type="date"
                                value={filters.dateFin}
                                onChange={(e) => setFilters({...filters, dateFin: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recherche
                            </label>
                            <input
                                type="text"
                                value={filters.recherche}
                                onChange={(e) => setFilters({...filters, recherche: e.target.value})}
                                placeholder="Réf, navire..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                        >
                            Réinitialiser
                        </Button>
                    </div>
                </Card>
            )}

            {/* Liste des mouvements */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date/Heure
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Référence
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantité
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Origine/Destination
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : filteredMouvements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Aucun mouvement trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredMouvements.map((mouvement) => (
                                    <tr key={mouvement.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">
                                                    {formatDate(mouvement.date_mouvement, 'dd/MM/yyyy')}
                                                </div>
                                                <div className="text-gray-500">
                                                    {formatDate(mouvement.date_mouvement, 'HH:mm')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getTypeColor(mouvement.type_mouvement)}>
                                                <div className="flex items-center space-x-1">
                                                    {getTypeIcon(mouvement.type_mouvement)}
                                                    <span>{MOVEMENT_TYPE_LABELS[mouvement.type_mouvement]}</span>
                                                </div>
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="font-medium text-gray-900">
                                                {mouvement.reference_document}
                                            </div>
                                            {mouvement.nom_navire && (
                                                <div className="text-gray-500 flex items-center space-x-1">
                                                    <Ship className="h-3 w-3" />
                                                    <span>{mouvement.nom_navire}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {mouvement.produit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`font-medium ${
                                                mouvement.type_mouvement === 'sortie' || mouvement.quantite < 0 
                                                    ? 'text-red-600' 
                                                    : 'text-green-600'
                                            }`}>
                                                {mouvement.type_mouvement === 'sortie' || mouvement.quantite < 0 ? '-' : '+'}
                                                {Math.abs(mouvement.quantite).toLocaleString()} tonnes
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {mouvement.magasin_destination || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="text-gray-900">{mouvement.operateur}</div>
                                            <div className="text-gray-500 text-xs">{mouvement.role_operateur}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Mouvements;