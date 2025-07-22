import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

export default function ClientSelector({ value, onChange }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CLIENTS.LIST);
      setClients(response.data || []);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const clientId = e.target.value;
    onChange(clientId || null);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-gray-400 animate-pulse" />
        <select disabled className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm">
          <option>Chargement...</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Users className="w-5 h-5 text-gray-400" />
      <select
        value={value || ''}
        onChange={handleChange}
        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tous les clients</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.nom}
          </option>
        ))}
      </select>
    </div>
  );
}