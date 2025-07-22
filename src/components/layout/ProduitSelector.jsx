import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import api from '../../services/api';

const ProduitSelector = ({ value, onChange }) => {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduits();
    }, []);

    const loadProduits = async () => {
        try {
            setLoading(true);
            const response = await api.get('/produits');
            setProduits(response.data || []);
        } catch (error) {
            console.error('Erreur chargement produits:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center px-3 py-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Chargement...</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">Tous les produits</option>
                {produits.map(produit => (
                    <option key={produit.id} value={produit.id}>
                        {produit.nom}
                    </option>
                ))}
            </select>
            
            {/* Icône de sélection */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
};

export default ProduitSelector;