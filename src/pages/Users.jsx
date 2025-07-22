import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, ROLE_LABELS } from '../utils/constants';
import { useMagasins } from '../hooks/useMagasins';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const Users = () => {
    const { user, hasPermission } = useAuth();
    const { magasins } = useMagasins();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        role: USER_ROLES.OPERATOR,
        magasin_id: '',
        magasins: [],
        actif: true
    });

    // Mock users pour démonstration
    const mockUsers = [
        {
            id: 1,
            email: 'admin@its-senegal.com',
            nom: 'Administrateur',
            prenom: 'ITS',
            role: 'admin',
            magasin_id: null,
            magasins: magasins?.map(m => m.id) || [],
            actif: true,
            created_at: '2024-01-01'
        },
        {
            id: 2,
            email: 'manager.dakar@its-senegal.com',
            nom: 'Diallo',
            prenom: 'Amadou',
            role: 'manager',
            magasin_id: 'dkr-port',
            magasins: ['dkr-port', 'dkr-ind'],
            actif: true,
            created_at: '2024-01-15'
        },
        {
            id: 3,
            email: 'operator.port@its-senegal.com',
            nom: 'Ndiaye',
            prenom: 'Fatou',
            role: 'operator',
            magasin_id: 'dkr-port',
            magasins: ['dkr-port'],
            actif: true,
            created_at: '2024-02-01'
        },
        {
            id: 4,
            email: 'delivery@its-senegal.com',
            nom: 'Mbaye',
            prenom: 'Ousmane',
            role: 'delivery_manager',
            magasin_id: null,
            magasins: magasins?.map(m => m.id) || [],
            actif: true,
            created_at: '2024-02-10'
        }
    ];

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            // Simuler un appel API
            setTimeout(() => {
                setUsers(mockUsers);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            setLoading(false);
        }
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            role: USER_ROLES.OPERATOR,
            magasin_id: '',
            magasins: [],
            actif: true
        });
        setShowModal(true);
    };

    const handleEditUser = (userToEdit) => {
        setSelectedUser(userToEdit);
        setFormData({
            nom: userToEdit.nom,
            prenom: userToEdit.prenom,
            email: userToEdit.email,
            role: userToEdit.role,
            magasin_id: userToEdit.magasin_id || '',
            magasins: userToEdit.magasins || [],
            actif: userToEdit.actif
        });
        setShowModal(true);
    };

    const handleSaveUser = async () => {
        try {
            // Simuler sauvegarde
            const newUser = {
                ...formData,
                id: selectedUser ? selectedUser.id : Date.now(),
                created_at: selectedUser ? selectedUser.created_at : new Date().toISOString()
            };

            if (selectedUser) {
                setUsers(users.map(u => u.id === selectedUser.id ? newUser : u));
            } else {
                setUsers([...users, newUser]);
            }

            setShowModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Erreur sauvegarde utilisateur:', error);
        }
    };

    const toggleUserStatus = async (userId) => {
        try {
            setUsers(users.map(u => 
                u.id === userId ? { ...u, actif: !u.actif } : u
            ));
        } catch (error) {
            console.error('Erreur changement statut:', error);
        }
    };

    const handleRoleChange = (newRole) => {
        setFormData(prev => {
            const updated = { ...prev, role: newRole };
            
            // Ajuster les magasins selon le rôle
            if (newRole === 'admin' || newRole === 'delivery_manager') {
                updated.magasin_id = null;
                updated.magasins = magasins?.map(m => m.id) || [];
            } else if (newRole === 'manager') {
                updated.magasins = prev.magasin_id ? [prev.magasin_id] : [];
            } else {
                updated.magasins = prev.magasin_id ? [prev.magasin_id] : [];
            }
            
            return updated;
        });
    };

    if (!hasPermission('users.read')) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Vous n'avez pas les permissions pour voir cette page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="text-gray-600">Gérez les comptes utilisateurs et leurs permissions</p>
                </div>
                {hasPermission('users.create') && (
                    <Button onClick={handleCreateUser} className="flex items-center gap-2">
                        <Plus size={20} />
                        Nouvel Utilisateur
                    </Button>
                )}
            </div>

            {/* Liste des utilisateurs */}
            <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Utilisateurs ({users.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Utilisateur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rôle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Magasins
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-blue-800">
                                                            {userItem.prenom[0]}{userItem.nom[0]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {userItem.prenom} {userItem.nom}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {userItem.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={userItem.role === 'admin' ? 'success' : 'primary'}>
                                                {ROLE_LABELS[userItem.role]}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {userItem.role === 'admin' || userItem.role === 'delivery_manager' 
                                                    ? 'Tous les magasins' 
                                                    : userItem.magasins?.map(magId => {
                                                        const mag = magasins?.find(m => m.id === magId);
                                                        return mag?.nom;
                                                    }).join(', ')
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={userItem.actif ? 'success' : 'danger'}>
                                                {userItem.actif ? 'Actif' : 'Inactif'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                {hasPermission('users.update') && (
                                                    <button
                                                        onClick={() => handleEditUser(userItem)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('users.update') && (
                                                    <button
                                                        onClick={() => toggleUserStatus(userItem.id)}
                                                        className={userItem.actif ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                                                    >
                                                        {userItem.actif ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Créer/Éditer */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                type="text"
                                value={formData.prenom}
                                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rôle
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                <option key={role} value={role}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {(formData.role === 'manager' || formData.role === 'operator') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Magasin Principal
                            </label>
                            <select
                                value={formData.magasin_id}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    magasin_id: e.target.value,
                                    magasins: e.target.value ? [e.target.value] : []
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Sélectionner un magasin</option>
                                {magasins?.map(magasin => (
                                    <option key={magasin.id} value={magasin.id}>
                                        {magasin.nom} - {magasin.ville}
                                    </option>
                                )) || []}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="actif"
                            checked={formData.actif}
                            onChange={(e) => setFormData(prev => ({ ...prev, actif: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="actif" className="ml-2 block text-sm text-gray-900">
                            Compte actif
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowModal(false)}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleSaveUser}>
                            {selectedUser ? 'Modifier' : 'Créer'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Users;