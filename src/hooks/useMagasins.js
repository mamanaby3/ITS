import { useState, useEffect } from 'react';
import magasinsService from '../services/magasins';

export const useMagasins = () => {
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMagasins();
  }, []);

  const loadMagasins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await magasinsService.getAll();
      setMagasins(data);
    } catch (err) {
      console.error('Erreur chargement magasins:', err);
      setError(err.message || 'Erreur lors du chargement des magasins');
    } finally {
      setLoading(false);
    }
  };

  const getMagasinById = (id) => {
    return magasins.find(m => m.id === id);
  };

  const getMagasinByNom = (nom) => {
    return magasins.find(m => m.nom === nom);
  };

  return {
    magasins,
    loading,
    error,
    reload: loadMagasins,
    getMagasinById,
    getMagasinByNom
  };
};

export default useMagasins;