import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
    Package, 
    Search, 
    AlertTriangle, 
    TrendingUp, 
    TrendingDown,
    Download,
    Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StockViewModal = ({ open, onClose, stock }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    // Filtrer et trier le stock
    const filteredStock = stock
        .filter(item => {
            const matchesSearch = item.produit?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.produit?.code.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (filterType === 'low') return matchesSearch && item.quantite_actuelle <= item.seuil_alerte;
            if (filterType === 'medium') return matchesSearch && item.quantite_actuelle > item.seuil_alerte && item.quantite_actuelle <= item.seuil_alerte * 2;
            if (filterType === 'high') return matchesSearch && item.quantite_actuelle > item.seuil_alerte * 2;
            
            return matchesSearch;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.produit?.nom.localeCompare(b.produit?.nom);
                case 'quantity':
                    return b.quantite_actuelle - a.quantite_actuelle;
                case 'percentage':
                    return (b.quantite_actuelle / b.quantite_max) - (a.quantite_actuelle / a.quantite_max);
                default:
                    return 0;
            }
        });

    const getStockStatus = (item) => {
        if (item.quantite_actuelle <= item.seuil_alerte) return { color: 'destructive', text: 'Stock bas' };
        if (item.quantite_actuelle <= item.seuil_alerte * 2) return { color: 'warning', text: 'Stock moyen' };
        return { color: 'success', text: 'Stock OK' };
    };

    const totalValue = filteredStock.reduce((acc, item) => acc + (item.quantite_actuelle * (item.produit?.prix_unitaire || 0)), 0);

    const exportToCSV = () => {
        const headers = ['Code', 'Produit', 'Quantité', 'Unité', 'Seuil Alerte', 'État', 'Pourcentage'];
        const rows = filteredStock.map(item => [
            item.produit?.code,
            item.produit?.nom,
            item.quantite_actuelle,
            item.produit?.unite,
            item.seuil_alerte,
            getStockStatus(item).text,
            `${Math.round((item.quantite_actuelle / item.quantite_max) * 100)}%`
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Package className="w-6 h-6 text-blue-600" />
                            État détaillé du Stock
                        </span>
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={exportToCSV}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exporter CSV
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                {/* Filtres et recherche */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                            placeholder="Rechercher par nom ou code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les produits</SelectItem>
                            <SelectItem value="low">Stock bas</SelectItem>
                            <SelectItem value="medium">Stock moyen</SelectItem>
                            <SelectItem value="high">Stock élevé</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Trier par nom</SelectItem>
                            <SelectItem value="quantity">Trier par quantité</SelectItem>
                            <SelectItem value="percentage">Trier par %</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">Total produits</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredStock.length}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-red-600 font-medium">Stock bas</p>
                        <p className="text-2xl font-bold text-red-900">
                            {filteredStock.filter(item => item.quantite_actuelle <= item.seuil_alerte).length}
                        </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">Stock OK</p>
                        <p className="text-2xl font-bold text-green-900">
                            {filteredStock.filter(item => item.quantite_actuelle > item.seuil_alerte * 2).length}
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium">Valeur totale</p>
                        <p className="text-2xl font-bold text-purple-900">
                            {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                        </p>
                    </div>
                </div>

                {/* Liste des produits */}
                <div className="overflow-y-auto max-h-[50vh] space-y-2">
                    {filteredStock.map((item) => {
                        const status = getStockStatus(item);
                        const percentage = (item.quantite_actuelle / item.quantite_max) * 100;
                        
                        return (
                            <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-lg">{item.produit?.nom}</h4>
                                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                                            <span>Code: {item.produit?.code}</span>
                                            <span>Catégorie: {item.produit?.categorie}</span>
                                        </div>
                                    </div>
                                    <Badge variant={status.color}>{status.text}</Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Quantité actuelle</p>
                                        <p className="font-semibold">
                                            {item.quantite_actuelle} {item.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Seuil d'alerte</p>
                                        <p className="font-semibold">
                                            {item.seuil_alerte} {item.produit?.unite}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Capacité max</p>
                                        <p className="font-semibold">
                                            {item.quantite_max} {item.produit?.unite}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Niveau de stock</span>
                                        <span className="font-medium">{Math.round(percentage)}%</span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>

                                {item.quantite_actuelle <= item.seuil_alerte && (
                                    <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Commande de réapprovisionnement recommandée</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredStock.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun produit trouvé</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default StockViewModal;