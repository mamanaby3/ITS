import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, Calendar, RefreshCw, FileDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatNumber, formatDate } from '../utils/formatters';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const TableauStock = () => {
    const { user, getCurrentMagasin } = useAuth();
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [resume, setResume] = useState({
        totalEntrees: 0,
        totalSorties: 0,
        totalDispatches: 0
    });

    const magasinId = getCurrentMagasin();

    useEffect(() => {
        if (magasinId) {
            loadStockJour();
        }
    }, [magasinId, selectedDate]);

    const loadStockJour = async () => {
        try {
            setLoading(true);
            
            // Initialiser le stock du jour si nécessaire
            await axios.post(
                `${API_CONFIG.BASE_URL}/api/stock-magasinier/magasin/${magasinId}/initialiser`,
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            // Charger les données du stock
            const response = await axios.get(
                `${API_CONFIG.BASE_URL}/api/stock-magasinier/magasin/${magasinId}/jour`,
                {
                    params: { date: selectedDate },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            setStockData(response.data.data || []);
            
            // Calculer le résumé
            const totals = response.data.data.reduce((acc, item) => ({
                totalEntrees: acc.totalEntrees + parseFloat(item.entrees || 0),
                totalSorties: acc.totalSorties + parseFloat(item.sorties || 0),
                totalDispatches: acc.totalDispatches + parseFloat(item.quantite_dispatchee || 0)
            }), { totalEntrees: 0, totalSorties: 0, totalDispatches: 0 });
            
            setResume(totals);
            
        } catch (error) {
            console.error('Erreur chargement stock:', error);
            toast.error('Erreur lors du chargement du stock');
        } finally {
            setLoading(false);
        }
    };

    const handleEntree = async (produitId) => {
        const quantite = prompt('Quantité à ajouter:');
        if (!quantite || isNaN(quantite) || parseFloat(quantite) <= 0) return;
        
        try {
            await axios.post(
                `${API_CONFIG.BASE_URL}/api/stock-magasinier/magasin/${magasinId}/entree`,
                {
                    produit_id: produitId,
                    quantite: parseFloat(quantite)
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            toast.success('Entrée enregistrée avec succès');
            loadStockJour();
        } catch (error) {
            console.error('Erreur enregistrement entrée:', error);
            toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
        }
    };

    const handleSortie = async (produitId, stockDisponible) => {
        const quantite = prompt('Quantité à sortir:');
        if (!quantite || isNaN(quantite) || parseFloat(quantite) <= 0) return;
        
        if (parseFloat(quantite) > stockDisponible) {
            toast.error(`Stock insuffisant. Disponible: ${stockDisponible}`);
            return;
        }
        
        try {
            await axios.post(
                `${API_CONFIG.BASE_URL}/api/stock-magasinier/magasin/${magasinId}/sortie`,
                {
                    produit_id: produitId,
                    quantite: parseFloat(quantite)
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            
            toast.success('Sortie enregistrée avec succès');
            loadStockJour();
        } catch (error) {
            console.error('Erreur enregistrement sortie:', error);
            toast.error(error.response?.data?.error || 'Erreur lors de l\'enregistrement');
        }
    };

    const exportToExcel = () => {
        const data = stockData.map(item => ({
            'Produit': item.produit_nom,
            'Référence': item.produit_reference,
            'Stock Initial': item.stock_initial,
            'Entrées': item.entrees,
            'Dispatches': item.quantite_dispatchee,
            'Sorties': item.sorties,
            'Stock Final': item.stock_final_calcule,
            'Unité': item.unite
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stock du jour');
        XLSX.writeFile(wb, `stock_${selectedDate}.xlsx`);
        toast.success('Export Excel réussi');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de Stock</h1>
                    <p className="text-gray-600">Gestion journalière du stock</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                    <Button
                        variant="outline"
                        onClick={loadStockJour}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                    <Button
                        variant="outline"
                        onClick={exportToExcel}
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                            <Plus className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Entrées</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(resume.totalEntrees)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Dispatches</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(resume.totalDispatches)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100">
                            <Minus className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Sorties</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(resume.totalSorties)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tableau principal */}
            <Card className="p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Initial
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entrées
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dispatches
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sorties
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Final
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stockData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Aucune donnée pour cette date
                                    </td>
                                </tr>
                            ) : (
                                stockData.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.produit_nom}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {item.produit_reference}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            {formatNumber(item.stock_initial)} {item.unite}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-medium text-green-600">
                                                +{formatNumber(item.entrees)} {item.unite}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-medium text-blue-600">
                                                +{formatNumber(item.quantite_dispatchee)} {item.unite}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-medium text-red-600">
                                                -{formatNumber(item.sorties)} {item.unite}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`text-sm font-bold ${
                                                item.stock_final_calcule < 50 ? 'text-red-600' : 'text-gray-900'
                                            }`}>
                                                {formatNumber(item.stock_final_calcule)} {item.unite}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 hover:text-green-700"
                                                    onClick={() => handleEntree(item.produit_id)}
                                                    disabled={selectedDate !== new Date().toISOString().split('T')[0]}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleSortie(item.produit_id, item.stock_final_calcule)}
                                                    disabled={
                                                        selectedDate !== new Date().toISOString().split('T')[0] ||
                                                        item.stock_final_calcule <= 0
                                                    }
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Note d'information */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>• Stock Final = Stock Initial + Entrées + Dispatches - Sorties</p>
                            <p>• Les actions sont disponibles uniquement pour la date du jour</p>
                            <p>• Le stock initial du jour est le stock final de la veille</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TableauStock;