// src/components/clients/ClientList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clientsService } from '../../services';
import ClientForm from './ClientForm';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    UsersIcon,
    FunnelIcon,
    ExclamationTriangleIcon,
    PhoneIcon,
    EnvelopeIcon
} from '../ui/SimpleIcons';

const ClientList = () => {
    const { hasPermission } = useAuth();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [sortField, setSortField] = useState('nom');
    const [sortDirection, setSortDirection] = useState('asc');

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        filterClients();
    }, [clients, searchTerm, selectedType, selectedStatus, sortField, sortDirection]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const [clientsData, statsData] = await Promise.all([
                clientsService.getAllClients(),
                clientsService.getClientsStats()
            ]);
            setClients(clientsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterClients = () => {
        let filtered = [...clients];

        // Recherche textuelle
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(client =>
                client.nom.toLowerCase().includes(term) ||
                client.contact.toLowerCase().includes(term) ||
                client.telephone.toLowerCase().includes(term) ||
                (client.email && client.email.toLowerCase().includes(term)) ||
                (client.codeClient && client.codeClient.toLowerCase().includes(term)) ||
                (client.adresse && client.adresse.toLowerCase().includes(term))
            );
        }

        // Filtrage par type
        if (selectedType) {
            filtered = filtered.filter(client => client.type === selectedType);
        }

        // Filtrage par statut
        if (selectedStatus) {
            filtered = filtered.filter(client => client.status === selectedStatus);
        }

        // Tri
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredClients(filtered);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleCreateClient = async (clientData) => {
        try {
            await clientsService.createClient(clientData);
            await loadClients();
            setShowForm(false);
        } catch (error) {
            throw error;
        }
    };

    const handleUpdateClient = async (clientData) => {
        try {
            await clientsService.updateClient(editingClient.id, clientData);
            await loadClients();
            setShowForm(false);
            setEditingClient(null);
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteClient = async () => {
        try {
            await clientsService.deleteClient(clientToDelete.id);
            await loadClients();
            setShowDeleteModal(false);
            setClientToDelete(null);
        } catch (error) {
            alert(error.message);
        }
    };

    const getTypeBadge = (type) => {
        const badges = {
            particulier: 'bg-blue-100 text-blue-800',
            entreprise: 'bg-green-100 text-green-800',
            administration: 'bg-purple-100 text-purple-800'
        };

        const displayType = type || 'entreprise';
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[displayType] || 'bg-gray-100 text-gray-800'}`}>
        {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
      </span>
        );
    };

    const getStatusBadge = (actif) => {
        const isActive = actif === true || actif === 1 || actif === '1';
        const status = isActive ? 'actif' : 'inactif';
        const badge = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
        );
    };

    const SortButton = ({ field, children }) => (
        <button
            onClick={() => handleSort(field)}
            className="group inline-flex items-center text-left font-medium text-gray-900 hover:text-gray-600"
        >
            {children}
            <span className="ml-2 flex-none rounded text-gray-400 group-hover:text-gray-600">
        {sortField === field ? (
            sortDirection === 'asc' ? '↑' : '↓'
        ) : (
            '↕'
        )}
      </span>
        </button>
    );

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
                    <p className="text-gray-600">
                        {filteredClients.length} client(s) affiché(s) sur {clients.length} total
                    </p>
                </div>

                {hasPermission('write') && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nouveau Client
                    </button>
                )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard
                    title="Total Clients"
                    value={stats.total || 0}
                    icon={UsersIcon}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Clients Actifs"
                    value={stats.actifs || 0}
                    icon={UsersIcon}
                    color="bg-green-500"
                />
                <StatCard
                    title="Entreprises"
                    value={stats.entreprises || 0}
                    icon={UsersIcon}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Nouveaux ce mois"
                    value={stats.nouveauxCeMois || 0}
                    icon={PlusIcon}
                    color="bg-emerald-500"
                />
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Recherche */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filtre par type */}
                    <div className="relative">
                        <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous les types</option>
                            <option value="particulier">Particulier</option>
                            <option value="entreprise">Entreprise</option>
                            <option value="administration">Administration</option>
                        </select>
                    </div>

                    {/* Filtre par statut */}
                    <div className="relative">
                        <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                        </select>
                    </div>

                    {/* Bouton reset */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedType('');
                            setSelectedStatus('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Tableau des clients */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="codeClient">Code</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="nom">Client</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="type">Type</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="status">Statut</SortButton>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <SortButton field="totalCommandes">Commandes</SortButton>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {client.codeClient}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                                            <div className="text-sm text-gray-500">{client.contact}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getTypeBadge(client.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <PhoneIcon className="h-4 w-4 mr-1" />
                                                {client.telephone}
                                            </div>
                                            {client.email && (
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                                                    {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(client.actif)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>
                                            <span className="font-medium">{client.totalCommandes || 0}</span>
                                            {client.totalAchats && client.totalAchats > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {client.totalAchats.toLocaleString()} FCFA
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="Voir détails"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>

                                            {hasPermission('write') && (
                                                <button
                                                    onClick={() => {
                                                        setEditingClient(client);
                                                        setShowForm(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1"
                                                    title="Modifier"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                            )}

                                            {hasPermission('delete') && (
                                                <button
                                                    onClick={() => {
                                                        setClientToDelete(client);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900 p-1"
                                                    title="Supprimer"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        {searchTerm || selectedType || selectedStatus
                                            ? 'Aucun client trouvé avec ces critères'
                                            : 'Aucun client enregistré'
                                        }
                                    </p>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de formulaire */}
            {showForm && (
                <ClientForm
                    client={editingClient}
                    isEditing={!!editingClient}
                    onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingClient(null);
                    }}
                />
            )}

            {/* Modal de suppression */}
            {showDeleteModal && clientToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Confirmer la suppression
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Êtes-vous sûr de vouloir supprimer le client "{clientToDelete.nom}" ?
                                Cette action est irréversible.
                            </p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setClientToDelete(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteClient}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;