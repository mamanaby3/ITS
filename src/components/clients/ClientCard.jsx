// src/components/clients/ClientCard.jsx
import React from 'react';
import { Users, Mail, Phone, MapPin, CreditCard, Calendar, Edit, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatPhone, formatDate } from '../../utils/formatters';
import { CLIENT_TYPE_LABELS } from '../../utils/constants';

const ClientCard = ({
    client,
    onEdit,
    onDelete,
    onView,
    showActions = true,
    showStats = true,
    className = ''
}) => {
    if (!client) return null;

    // Déterminer le statut du crédit
    const getCreditStatus = () => {
        if (!client.creditLimit || client.creditLimit === 0) {
            return null;
        }
        
        const creditUtilise = client.creditUtilise || 0;
        const pourcentageUtilise = (creditUtilise / client.creditLimit) * 100;
        
        if (pourcentageUtilise >= 100) {
            return { label: 'Limite atteinte', color: 'red', percentage: 100 };
        }
        if (pourcentageUtilise >= 80) {
            return { label: 'Crédit élevé', color: 'yellow', percentage: pourcentageUtilise };
        }
        return { label: 'Normal', color: 'green', percentage: pourcentageUtilise };
    };

    const creditStatus = getCreditStatus();

    return (
        <Card 
            className={`hover:shadow-lg transition-shadow ${onView ? 'cursor-pointer' : ''} ${className}`}
            onClick={() => onView?.(client)}
        >
            <div className="p-6">
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {client.nom}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {client.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge variant="blue" size="sm">
                            {CLIENT_TYPE_LABELS[client.type] || client.type}
                        </Badge>
                        {client.actif === false && (
                            <Badge variant="gray" size="sm">
                                Inactif
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Informations de contact */}
                <div className="space-y-2 mb-4">
                    {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{client.email}</span>
                        </div>
                    )}
                    {client.telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{formatPhone(client.telephone)}</span>
                        </div>
                    )}
                    {(client.adresse || client.ville) && (
                        <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                            <span className="line-clamp-2">
                                {[client.adresse, client.ville, client.pays].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Informations crédit */}
                {client.creditLimit > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                                <CreditCard className="h-4 w-4 mr-1" />
                                Crédit
                            </span>
                            {creditStatus && (
                                <Badge variant={creditStatus.color} size="sm">
                                    {creditStatus.label}
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Limite</span>
                                <span className="font-medium">{formatCurrency(client.creditLimit)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Utilisé</span>
                                <span className="font-medium">{formatCurrency(client.creditUtilise || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Disponible</span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(client.creditLimit - (client.creditUtilise || 0))}
                                </span>
                            </div>
                        </div>
                        {creditStatus && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${
                                            creditStatus.color === 'red' ? 'bg-red-500' :
                                            creditStatus.color === 'yellow' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(creditStatus.percentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Statistiques */}
                {showStats && (client.totalCommandes > 0 || client.totalAchats > 0) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-gray-900">{client.totalCommandes || 0}</p>
                            <p className="text-xs text-gray-600">Commandes</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(client.totalAchats || 0)}
                            </p>
                            <p className="text-xs text-gray-600">Total achats</p>
                        </div>
                    </div>
                )}

                {/* Dernière commande */}
                {client.derniereCommande && (
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Dernière commande : {formatDate(client.derniereCommande, 'dd/MM/yyyy')}</span>
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(client);
                                }}
                                className="flex items-center space-x-1"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Modifier</span>
                            </Button>
                        )}
                        {onDelete && client.actif !== false && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(client);
                                }}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Supprimer</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ClientCard;