import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import magasinsService from '../../services/magasins';
import { useMagasins } from '../../hooks/useMagasins';

const MagasinSelector = ({ value, onChange }) => {
    const { 
        user, 
        isAdmin, 
        getUserMagasins
    } = useAuth();
    const { magasins } = useMagasins();
    
    const [magasinsAccessibles, setMagasinsAccessibles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMagasins = async () => {
            try {
                setLoading(true);
                
                // Obtenir les magasins accessibles
                const userMagasins = getUserMagasins();
                const magasinsData = (magasins || []).filter(m => 
                    isAdmin() || userMagasins.includes(m.id)
                );
                
                setMagasinsAccessibles(magasinsData);
                
                // Si aucune valeur n'est passée et qu'on a des magasins, utiliser le premier
                if (!value && onChange && magasinsData.length > 0) {
                    onChange(magasinsData[0].id.toString());
                }
            } catch (error) {
                console.error('Erreur chargement magasins:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadMagasins();
        }
    }, [user, isAdmin, getUserMagasins, magasins]);

    const handleMagasinChange = (magasinId) => {
        if (onChange) {
            onChange(magasinId);
            // Sauvegarder dans localStorage pour persister le choix
            localStorage.setItem('selectedMagasin', magasinId);
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

    // Si un seul magasin, ne pas afficher le sélecteur
    if (magasinsAccessibles.length <= 1) {
        const magasin = magasinsAccessibles[0];
        return (
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-700">
                    {magasin?.nom || 'Aucun magasin'}
                </span>
            </div>
        );
    }

    const selectedMagasin = magasinsAccessibles.find(m => m.id === parseInt(value));

    return (
        <div className="relative">
            <select
                value={value || ''}
                onChange={(e) => handleMagasinChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                {magasinsAccessibles.map(magasin => (
                    <option key={magasin.id} value={magasin.id}>
                        {magasin.nom} - {magasin.ville}
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

export default MagasinSelector;