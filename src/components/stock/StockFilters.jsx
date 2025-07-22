// src/components/stock/StockFilters.jsx
import React from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { STOCK_ALERT_LEVELS, PRODUIT_CATEGORIES } from '../../utils/constants';
import { useMagasins } from '../../hooks/useMagasins';

const StockFilters = ({
    filters = {},
    onChange,
    stock = [],
    className = ''
}) => {
    const { magasins } = useMagasins();
    
    // Extraire les valeurs uniques pour les filtres
    const categories = [...new Set(stock.map(item => item.produit?.categorie).filter(Boolean))];
    const emplacements = [...new Set(stock.map(item => item.emplacement).filter(Boolean))];
    
    // G�rer le changement de filtre
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters };
        
        if (value === '' || value === null) {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        
        onChange(newFilters);
    };

    // R�initialiser les filtres
    const handleReset = () => {
        onChange({});
    };

    // Compter les filtres actifs
    const activeFiltersCount = Object.keys(filters).length;

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtre par cat�gorie */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cat�gorie
                    </label>
                    <select
                        value={filters.categorie || ''}
                        onChange={(e) => handleFilterChange('categorie', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Toutes les cat�gories</option>
                        {Object.entries(PRODUIT_CATEGORIES).map(([key, value]) => (
                            <option key={key} value={value}>
                                {PRODUIT_CATEGORIES_LABELS?.[value] || value}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtre par emplacement */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emplacement
                    </label>
                    <select
                        value={filters.emplacement || ''}
                        onChange={(e) => handleFilterChange('emplacement', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tous les emplacements</option>
                        {emplacements.map(emp => (
                            <option key={emp} value={emp}>{emp}</option>
                        ))}
                    </select>
                </div>

                {/* Filtre par statut */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Statut du stock
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tous les statuts</option>
                        <option value={STOCK_ALERT_LEVELS.OK}>Stock normal</option>
                        <option value={STOCK_ALERT_LEVELS.FAIBLE}>Stock faible</option>
                        <option value={STOCK_ALERT_LEVELS.CRITIQUE}>Stock critique</option>
                        <option value={STOCK_ALERT_LEVELS.VIDE}>Rupture de stock</option>
                    </select>
                </div>

                {/* Filtre par entrep�t */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrep�t
                    </label>
                    <select
                        value={filters.entrepotId || ''}
                        onChange={(e) => handleFilterChange('entrepotId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Tous les entrep�ts</option>
                        {magasins.map(entrepot => (
                            <option key={entrepot.id} value={entrepot.id}>
                                {entrepot.nom}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Options suppl�mentaires */}
            <div className="flex flex-wrap gap-4">
                {/* Produits expirant bient�t */}
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.expirationSoon || false}
                        onChange={(e) => handleFilterChange('expirationSoon', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                        Produits expirant dans 30 jours
                    </span>
                </label>

                {/* Produits avec alertes */}
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.hasAlerts || false}
                        onChange={(e) => handleFilterChange('hasAlerts', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                        Produits avec alertes uniquement
                    </span>
                </label>
            </div>

            {/* Actions */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="flex items-center space-x-1"
                    >
                        <X className="h-4 w-4" />
                        <span>R�initialiser</span>
                    </Button>
                </div>
            )}
        </div>
    );
};

// Export des labels pour les cat�gories
export const PRODUIT_CATEGORIES_LABELS = {
    alimentaire: 'Denr�es alimentaires',
    chimique: 'Produits chimiques',
    materiaux: 'Mat�riaux de construction',
    petrole: 'Produits p�troliers',
    equipement: '�quipements',
    autre: 'Autres'
};

export default StockFilters;