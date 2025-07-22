// src/components/clients/ClientDetails.jsx
import React, { useState } from 'react';
import {
    Users,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    FileText,
    TrendingUp,
    Package,
    DollarSign,
    Clock,
    Edit,
    Trash2,
    X,
    ShoppingCart
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { formatCurrency, formatDate, formatPhone, formatAddress } from '../../utils/formatters';
import { CLIENT_TYPE_LABELS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';

const ClientDetails = ({
    isOpen,
    onClose,
    client,
    commandes = [],
    statistiques = {},
    onEdit,
    onDelete,
    onNewOrder,
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState('informations');

    if (!client) return null;

    // Calculer le statut du crédit
    const getCreditStatus = () => {
        if (!client.creditLimit || client.creditLimit === 0) {
            return null;
        }
        
        const creditUtilise = client.creditUtilise || 0;
        const creditDisponible = client.creditLimit - creditUtilise;
        const pourcentageUtilise = (creditUtilise / client.creditLimit) * 100;
        
        return {
            limite: client.creditLimit,
            utilise: creditUtilise,
            disponible: creditDisponible,
            pourcentage: pourcentageUtilise,
            statut: pourcentageUtilise >= 100 ? 'depasse' : 
                    pourcentageUtilise >= 80 ? 'eleve' : 'normal'
        };
    };

    const creditInfo = getCreditStatus();

    const tabs = [
        { id: 'informations', label: 'Informations', icon: Users },
        { id: 'commandes', label: 'Commandes', icon: ShoppingCart },
        { id: 'credit', label: 'Crédit', icon: CreditCard },
        { id: 'statistiques', label: 'Statistiques', icon: TrendingUp }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex flex-col h-full max-h-[90vh]">
                {/* En-tête */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{client.nom}</h2>
                                <p className="text-sm text-gray-500">{client.code}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Badge variant="blue">
                                        {CLIENT_TYPE_LABELS[client.type] || client.type}
                                    </Badge>
                                    {client.actif === false && (
                                        <Badge variant="gray">Inactif</Badge>
                                    )}
                                    {creditInfo && (
                                        <Badge 
                                            variant={
                                                creditInfo.statut === 'depasse' ? 'red' :
                                                creditInfo.statut === 'eleve' ? 'yellow' : 'green'
                                            }
                                        >
                                            Crédit {creditInfo.pourcentage.toFixed(0)}%
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Onglets */}
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8 px-6">
                        {tabs.map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <TabIcon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Onglet Informations */}
                            {activeTab === 'informations' && (
                                <div className="space-y-6">
                                    <Card>
                                        <div className="p-6 space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Nom</label>
                                                    <p className="mt-1 text-gray-900">{client.nom}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Code client</label>
                                                    <p className="mt-1 text-gray-900">{client.code}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Type</label>
                                                    <p className="mt-1 text-gray-900">
                                                        {CLIENT_TYPE_LABELS[client.type] || client.type}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Statut</label>
                                                    <p className="mt-1">
                                                        <Badge variant={client.actif !== false ? 'green' : 'gray'}>
                                                            {client.actif !== false ? 'Actif' : 'Inactif'}
                                                        </Badge>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <div className="p-6 space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Coordonnées</h3>
                                            
                                            <div className="space-y-3">
                                                {client.email && (
                                                    <div className="flex items-center">
                                                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Email</p>
                                                            <p className="text-gray-900">{client.email}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {client.telephone && (
                                                    <div className="flex items-center">
                                                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Téléphone</p>
                                                            <p className="text-gray-900">{formatPhone(client.telephone)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {(client.adresse || client.ville) && (
                                                    <div className="flex items-start">
                                                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Adresse</p>
                                                            <p className="text-gray-900">
                                                                {formatAddress(client.adresse, client.ville, client.pays)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    {client.notes && (
                                        <Card>
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                                                <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Commandes */}
                            {activeTab === 'commandes' && (
                                <div className="space-y-4">
                                    {commandes.length === 0 ? (
                                        <Card className="p-12 text-center">
                                            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucune commande enregistrée</p>
                                            {onNewOrder && (
                                                <Button
                                                    onClick={() => onNewOrder(client)}
                                                    className="mt-4"
                                                >
                                                    Nouvelle commande
                                                </Button>
                                            )}
                                        </Card>
                                    ) : (
                                        <>
                                            <div className="flex justify-end mb-4">
                                                {onNewOrder && (
                                                    <Button onClick={() => onNewOrder(client)}>
                                                        Nouvelle commande
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {commandes.map((commande) => (
                                                    <Card key={commande.id} className="p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center space-x-3">
                                                                    <FileText className="h-5 w-5 text-gray-400" />
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">
                                                                            {commande.numero}
                                                                        </p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {formatDate(commande.date)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold text-gray-900">
                                                                    {formatCurrency(commande.montantTotal)}
                                                                </p>
                                                                <Badge 
                                                                    variant={ORDER_STATUS_COLORS[commande.statut] || 'gray'}
                                                                    size="sm"
                                                                >
                                                                    {ORDER_STATUS_LABELS[commande.statut] || commande.statut}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Onglet Crédit */}
                            {activeTab === 'credit' && (
                                <div className="space-y-6">
                                    {creditInfo ? (
                                        <>
                                            <Card>
                                                <div className="p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Situation du crédit</h3>
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    Utilisation du crédit
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {creditInfo.pourcentage.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                                <div 
                                                                    className={`h-3 rounded-full transition-all ${
                                                                        creditInfo.statut === 'depasse' ? 'bg-red-500' :
                                                                        creditInfo.statut === 'eleve' ? 'bg-yellow-500' :
                                                                        'bg-green-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(creditInfo.pourcentage, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-4 pt-4">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-gray-900">
                                                                    {formatCurrency(creditInfo.limite)}
                                                                </p>
                                                                <p className="text-sm text-gray-500">Limite</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-red-600">
                                                                    {formatCurrency(creditInfo.utilise)}
                                                                </p>
                                                                <p className="text-sm text-gray-500">Utilisé</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold text-green-600">
                                                                    {formatCurrency(creditInfo.disponible)}
                                                                </p>
                                                                <p className="text-sm text-gray-500">Disponible</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Historique des paiements récents */}
                                            <Card>
                                                <div className="p-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                        Historique des paiements
                                                    </h3>
                                                    <div className="text-center text-gray-500 py-8">
                                                        <Clock className="h-12 w-12 mx-auto mb-2" />
                                                        <p>Historique disponible prochainement</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </>
                                    ) : (
                                        <Card className="p-12 text-center">
                                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">Aucune limite de crédit définie</p>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Onglet Statistiques */}
                            {activeTab === 'statistiques' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Total commandes</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {client.totalCommandes || 0}
                                                    </p>
                                                </div>
                                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                                            </div>
                                        </Card>
                                        
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatCurrency(client.totalAchats || 0)}
                                                    </p>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-green-600" />
                                            </div>
                                        </Card>
                                        
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Panier moyen</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {formatCurrency(
                                                            client.totalCommandes > 0 
                                                                ? (client.totalAchats || 0) / client.totalCommandes
                                                                : 0
                                                        )}
                                                    </p>
                                                </div>
                                                <Package className="h-8 w-8 text-purple-600" />
                                            </div>
                                        </Card>
                                    </div>

                                    {client.derniereCommande && (
                                        <Card className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité</h3>
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <Calendar className="h-5 w-5 text-gray-400" />
                                                <span>Dernière commande :</span>
                                                <span className="font-medium">
                                                    {formatDate(client.derniereCommande)}
                                                </span>
                                            </div>
                                        </Card>
                                    )}

                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Évolution des achats
                                        </h3>
                                        <div className="text-center text-gray-500 py-8">
                                            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                                            <p>Graphique disponible prochainement</p>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {client.dateCreation && (
                                <p className="text-sm text-gray-500">
                                    Client depuis {formatDate(client.dateCreation)}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    onClick={() => onEdit(client)}
                                    className="flex items-center space-x-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Modifier</span>
                                </Button>
                            )}
                            {onDelete && client.actif !== false && (
                                <Button
                                    variant="outline"
                                    onClick={() => onDelete(client)}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Supprimer</span>
                                </Button>
                            )}
                            <Button variant="outline" onClick={onClose}>
                                Fermer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ClientDetails;