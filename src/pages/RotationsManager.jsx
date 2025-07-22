import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const RotationsManager = () => {
  const { user } = useAuth();
  const [rotations, setRotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [stats, setStats] = useState({
    totalRotations: 0,
    totalCamions: 0,
    totalTonnage: 0
  });

  useEffect(() => {
    if (user) {
      fetchRotations();
    }
  }, [user]);

  const fetchRotations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('its_auth_token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const params = new URLSearchParams({
        per_page: '100'
      });

      if (dateFilter) {
        params.append('date', dateFilter);
      }

      const response = await fetch(`http://localhost:5000/api/livraisons?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Rotations reçues:', data);
      
      const rotationsList = data.data || [];
      setRotations(rotationsList);

      // Calculer les statistiques
      const totalRotations = rotationsList.length;
      const uniqueCamions = [...new Set(rotationsList.map(r => r.numero_camion))].length;
      const totalTonnage = rotationsList.reduce((sum, r) => sum + (parseFloat(r.quantite) || 0), 0);

      setStats({
        totalRotations,
        totalCamions: uniqueCamions,
        totalTonnage
      });
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors du chargement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRotations = rotations.filter(rotation => 
    rotation.numero_camion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rotation.transporteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rotation.nom_chauffeur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rotation.numero_bon_livraison?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'en_cours': return '#3b82f6';
      case 'livre': return '#10b981';
      case 'planifie': return '#f59e0b';
      case 'annule': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatutText = (statut) => {
    switch(statut) {
      case 'en_cours': return 'En transit';
      case 'livre': return 'Livré';
      case 'planifie': return 'Planifié';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1e40af', marginBottom: '10px', fontSize: '28px' }}>
          🚛 Rotations des Camions
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Suivi des passages de camions et traçabilité logistique
        </p>
      </div>

      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>{stats.totalRotations}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Total rotations</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.totalCamions}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Camions différents</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.totalTonnage.toFixed(1)}T</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Tonnage total</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher par camion, transporteur, chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={fetchRotations}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? '⏳' : '🔄'} Actualiser
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          ❌ {error}
        </div>
      )}

      {/* Liste des rotations */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, color: '#374151' }}>
            📋 Historique des rotations ({filteredRotations.length})
          </h2>
        </div>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              ⏳ Chargement des rotations...
            </div>
          )}

          {!loading && filteredRotations.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              📦 Aucune rotation trouvée
            </div>
          )}

          {filteredRotations.map((rotation) => (
            <div
              key={rotation.id}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f3f4f6',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: '#1f2937'
                    }}>
                      🚛 {rotation.numero_camion}
                    </span>
                    <span style={{
                      backgroundColor: getStatutColor(rotation.statut),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatutText(rotation.statut)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: '#6b7280' }}>
                    <div><strong>Transporteur:</strong> {rotation.transporteur}</div>
                    <div><strong>Chauffeur:</strong> {rotation.nom_chauffeur}</div>
                    <div><strong>Produit:</strong> {rotation.produit?.nom || 'N/A'}</div>
                    <div><strong>Quantité:</strong> {rotation.quantite}T</div>
                    <div><strong>N° Bon:</strong> {rotation.numero_bon_livraison}</div>
                    <div><strong>Destination:</strong> {rotation.destination_nom}</div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  {rotation.date_livraison && (
                    <div>📅 {new Date(rotation.date_livraison).toLocaleDateString('fr-FR')}</div>
                  )}
                  {rotation.heure_depart && (
                    <div>🕐 {rotation.heure_depart}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RotationsManager;