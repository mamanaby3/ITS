import React, { useState, useEffect } from 'react';
import { 
    ArrowDownTrayIcon as DocumentArrowDownIcon, 
    ChartBarIcon, 
    CubeIcon, 
    TruckIcon,
    UsersIcon,
    ArrowPathIcon,
    CalendarIcon,
    FunnelIcon
} from '../components/ui/SimpleIcons';
import { useAuth } from '../hooks/useAuth';
import { stockService } from '../services/stock';
import { commandesService } from '../services/commandes';
import clientsService from '../services/clients';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingState from '../components/ui/LoadingState';
import { 
    generateStockReportPDF, 
    generateStockReportExcel,
    generateEntreesReportPDF,
    generateEntreesReportExcel,
    generateMovementsReportPDF 
} from '../utils/reportGenerator';
import { formatDate } from '../utils/formatters';
import { PERMISSIONS } from '../utils/constants';

const Rapports = () => {
    const { hasPermission } = useAuth();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        dateDebut: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        dateFin: formatDate(new Date(), 'yyyy-MM-dd'),
        magasin: '',
        type: ''
    });

    const reportTypes = [
        {
            id: 'stock',
            title: 'Rapport de Stock',
            description: 'État actuel du stock par produit et magasin',
            icon: CubeIcon,
            color: 'blue',
            permission: PERMISSIONS.RAPPORTS_STOCK,
            actions: [
                { label: 'PDF', format: 'pdf', handler: handleStockReportPDF },
                { label: 'Excel', format: 'excel', handler: handleStockReportExcel }
            ]
        },
        {
            id: 'entrees',
            title: 'Rapport des Entrées',
            description: 'Analyse des entrées sur la période sélectionnée',
            icon: ChartBarIcon,
            color: 'green',
            permission: PERMISSIONS.RAPPORTS_FINANCIAL,
            actions: [
                { label: 'PDF', format: 'pdf', handler: handleEntreesReportPDF },
                { label: 'Excel', format: 'excel', handler: handleEntreesReportExcel }
            ]
        },
        {
            id: 'mouvements',
            title: 'Rapport des Mouvements',
            description: 'Historique des entrées et sorties de stock',
            icon: ArrowPathIcon,
            color: 'purple',
            permission: PERMISSIONS.RAPPORTS_OPERATIONAL,
            actions: [
                { label: 'PDF', format: 'pdf', handler: handleMovementsReportPDF }
            ]
        },
        {
            id: 'livraisons',
            title: 'Rapport des Livraisons',
            description: 'Suivi des livraisons et performances',
            icon: TruckIcon,
            color: 'yellow',
            permission: PERMISSIONS.RAPPORTS_LIVRAISONS,
            actions: [
                { label: 'PDF', format: 'pdf', handler: handleLivraisonsReportPDF },
                { label: 'Excel', format: 'excel', handler: handleLivraisonsReportExcel }
            ]
        },
        {
            id: 'clients',
            title: 'Rapport Clients',
            description: 'Analyse des clients et créances',
            icon: UsersIcon,
            color: 'indigo',
            permission: PERMISSIONS.RAPPORTS_FINANCIAL,
            actions: [
                { label: 'PDF', format: 'pdf', handler: handleClientsReportPDF },
                { label: 'Excel', format: 'excel', handler: handleClientsReportExcel }
            ]
        }
    ];

    // Filtrer les rapports selon les permissions
    const availableReports = reportTypes.filter(report => 
        hasPermission(report.permission) || hasPermission(PERMISSIONS.RAPPORTS_ALL)
    );

    async function handleStockReportPDF() {
        setLoading(true);
        try {
            const stockData = await stockService.getAll(filters);
            generateStockReportPDF(stockData, filters);
        } catch (error) {
            console.error('Erreur génération rapport stock PDF:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleStockReportExcel() {
        setLoading(true);
        try {
            const stockData = await stockService.getAll(filters);
            generateStockReportExcel(stockData, filters);
        } catch (error) {
            console.error('Erreur génération rapport stock Excel:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleEntreesReportPDF() {
        setLoading(true);
        try {
            const commandes = await commandesService.getAll({
                dateDebut: filters.dateDebut,
                dateFin: filters.dateFin,
                statut: 'livree'
            });
            
            const entreesData = commandes.map(cmd => ({
                date_commande: cmd.date_commande,
                numero_commande: cmd.numero,
                client_nom: cmd.client?.nom || 'Client inconnu',
                nombre_produits: cmd.produits?.length || 0,
                montant_total: cmd.montant_total || 0,
                details: cmd.produits
            }));
            
            generateEntreesReportPDF(entreesData, {
                start: formatDate(filters.dateDebut),
                end: formatDate(filters.dateFin)
            });
        } catch (error) {
            console.error('Erreur génération rapport entrées PDF:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleEntreesReportExcel() {
        setLoading(true);
        try {
            const commandes = await commandesService.getAll({
                dateDebut: filters.dateDebut,
                dateFin: filters.dateFin,
                statut: 'livree'
            });
            
            const entreesData = commandes.map(cmd => ({
                date_commande: cmd.date_commande,
                numero_commande: cmd.numero,
                client_nom: cmd.client?.nom || 'Client inconnu',
                nombre_produits: cmd.produits?.length || 0,
                montant_total: cmd.montant_total || 0,
                details: cmd.produits
            }));
            
            generateEntreesReportExcel(entreesData, {
                start: formatDate(filters.dateDebut),
                end: formatDate(filters.dateFin)
            });
        } catch (error) {
            console.error('Erreur génération rapport entrées Excel:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleMovementsReportPDF() {
        setLoading(true);
        try {
            const movements = await stockService.getMouvements({
                dateDebut: filters.dateDebut,
                dateFin: filters.dateFin,
                magasin: filters.magasin
            });
            
            generateMovementsReportPDF(movements, filters);
        } catch (error) {
            console.error('Erreur génération rapport mouvements PDF:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleLivraisonsReportPDF() {
        // À implémenter avec le service livraisons
        alert('Rapport livraisons PDF - En cours de développement');
    }

    async function handleLivraisonsReportExcel() {
        // À implémenter avec le service livraisons
        alert('Rapport livraisons Excel - En cours de développement');
    }

    async function handleClientsReportPDF() {
        setLoading(true);
        try {
            const clients = await clientsService.getAllClients();
            // Implémenter la génération du rapport clients
            alert('Rapport clients PDF - En cours de développement');
        } catch (error) {
            console.error('Erreur génération rapport clients PDF:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    async function handleClientsReportExcel() {
        setLoading(true);
        try {
            const clients = await clientsService.getAll();
            // Implémenter la génération du rapport clients
            alert('Rapport clients Excel - En cours de développement');
        } catch (error) {
            console.error('Erreur génération rapport clients Excel:', error);
            alert('Erreur lors de la génération du rapport');
        } finally {
            setLoading(false);
        }
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports</h1>
                <p className="text-gray-600">Générez des rapports détaillés pour l'analyse et le suivi</p>
            </div>

            {/* Filtres globaux */}
            <Card className="mb-8">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold">Filtres</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date début
                            </label>
                            <Input
                                type="date"
                                name="dateDebut"
                                value={filters.dateDebut}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date fin
                            </label>
                            <Input
                                type="date"
                                name="dateFin"
                                value={filters.dateFin}
                                onChange={handleFilterChange}
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Magasin
                            </label>
                            <select
                                name="magasin"
                                value={filters.magasin}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les magasins</option>
                                {MAGASINS.map(magasin => (
                                    <option key={magasin.id} value={magasin.id}>
                                        {magasin.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => setFilters({
                                    dateDebut: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                                    dateFin: formatDate(new Date(), 'yyyy-MM-dd'),
                                    magasin: '',
                                    type: ''
                                })}
                                className="w-full"
                            >
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Liste des rapports disponibles */}
            {loading ? (
                <LoadingState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableReports.map(report => (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 bg-${report.color}-100 rounded-lg`}>
                                        <report.icon className={`h-6 w-6 text-${report.color}-600`} />
                                    </div>
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {report.title}
                                </h3>
                                
                                <p className="text-sm text-gray-600 mb-4">
                                    {report.description}
                                </p>
                                
                                <div className="flex gap-2">
                                    {report.actions.map(action => (
                                        <Button
                                            key={action.format}
                                            variant="outline"
                                            size="sm"
                                            onClick={action.handler}
                                            className="flex-1"
                                        >
                                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Message si aucun rapport disponible */}
            {availableReports.length === 0 && !loading && (
                <Card>
                    <div className="p-8 text-center">
                        <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Aucun rapport disponible
                        </h3>
                        <p className="text-gray-600">
                            Vous n'avez pas les permissions nécessaires pour accéder aux rapports.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Rapports;