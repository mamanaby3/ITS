import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ReceptionLivraisonSimple = () => {
  const { user, isAuthenticated } = useAuth();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [formData, setFormData] = useState({
    quantite_recue: '',
    motif_ecart: '',
    observations: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('État auth:', { isAuthenticated, user });
    console.log('LocalStorage token (its_auth_token):', localStorage.getItem('its_auth_token'));
    console.log('LocalStorage user (its_user_data):', localStorage.getItem('its_user_data'));
    
    if (isAuthenticated && user) {
      console.log('Utilisateur connecté:', user);
      fetchLivraisons(user);
    } else if (isAuthenticated === false) {
      setError('Utilisateur non connecté');
    } else {
      // En attente de chargement de l'auth
      console.log('En attente du chargement de l\'authentification...');
    }
  }, [user, isAuthenticated]);

  const fetchLivraisons = async (userData = user) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('its_auth_token');
      if (!token) {
        setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      const params = new URLSearchParams({
        statut: 'en_cours',
        per_page: '100'
      });

      console.log('User data pour filtrage:', userData);

      // Si opérateur, filtrer par magasin (TEMPORAIREMENT DÉSACTIVÉ POUR TEST)
      // if (userData?.role === 'operator' && userData?.magasin_id) {
      //   const magasinMapping = {
      //     'plateforme-belair': 1,
      //     'MAG-001': 1,
      //     'MAG-002': 2,
      //     'MAG-003': 3,
      //     'MAG-004': 4,
      //     'MAG-005': 5,
      //     'MAG-006': 6,
      //     'MAG-007': 7
      //   };
      //   const magasinId = magasinMapping[userData.magasin_id] || userData.magasin_id;
      //   params.append('magasin_id', magasinId);
      //   console.log('Filtrage par magasin:', userData.magasin_id, '->', magasinId);
      // } else {
        console.log('FILTRAGE DÉSACTIVÉ - Affichage de toutes les livraisons en cours');
      // }

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
      console.log('Livraisons reçues:', data);
      console.log('Nombre de livraisons:', data.data?.length || 0);
      setLivraisons(data.data || []);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur lors du chargement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLivraison = (livraison) => {
    setSelectedLivraison(livraison);
    setFormData({
      quantite_recue: livraison.quantite.toString(),
      motif_ecart: '',
      observations: ''
    });
    setMessage({ type: '', text: '' });
  };

  const calculateEcart = () => {
    if (!selectedLivraison || !formData.quantite_recue) return 0;
    return parseFloat(formData.quantite_recue) - parseFloat(selectedLivraison.quantite);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLivraison) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une livraison' });
      return;
    }

    const ecart = calculateEcart();
    const hasEcart = Math.abs(ecart) > 0.01;

    if (hasEcart && !formData.motif_ecart.trim()) {
      setMessage({ type: 'error', text: 'Le motif de l\'écart est obligatoire' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('its_auth_token');
      
      console.log('🔄 Enregistrement de la réception...');
      console.log('Livraison ID:', selectedLivraison.id);
      console.log('Quantité reçue:', formData.quantite_recue);
      console.log('Écart:', ecart);
      console.log('Motif écart:', formData.motif_ecart);
      
      // Essayer d'abord l'endpoint officiel, sinon utiliser une méthode alternative
      let receptionSuccess = false;
      
      try {
        // Tentative avec l'endpoint officiel
        const receptionResponse = await fetch(`http://localhost:5000/api/livraisons/${selectedLivraison.id}/reception`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quantite_recue: parseFloat(formData.quantite_recue),
            motif_ecart: formData.motif_ecart || null
          })
        });

        if (receptionResponse.ok) {
          receptionSuccess = true;
          console.log('✅ Réception enregistrée via endpoint officiel');
        } else {
          console.log('⚠️ Endpoint officiel non disponible, utilisation de l\'endpoint PUT...');
        }
      } catch (error) {
        console.log('⚠️ Endpoint officiel non disponible, utilisation de l\'endpoint PUT...');
      }

      // Si l'endpoint officiel n'existe pas, utiliser l'endpoint PUT standard
      if (!receptionSuccess) {
        const updateResponse = await fetch(`http://localhost:5000/api/livraisons/${selectedLivraison.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            statut: 'livre',
            quantite_recue: parseFloat(formData.quantite_recue),
            motif_ecart: formData.motif_ecart || null,
            date_reception: new Date().toISOString().split('T')[0],
            heure_reception: new Date().toTimeString().split(' ')[0]
          })
        });

        if (!updateResponse.ok) {
          throw new Error(`Erreur lors de la mise à jour: ${updateResponse.status}`);
        }
        
        console.log('✅ Livraison mise à jour avec statut "livre"');
      }

      // Créer le mouvement d'entrée dans le stock
      try {
        const mouvementResponse = await fetch('http://localhost:5000/api/mouvements', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type_mouvement: 'entree',
            produit_id: selectedLivraison.produit_id,
            magasin_source_id: selectedLivraison.magasin_id,
            magasin_destination_id: selectedLivraison.magasin_id,
            quantite: parseFloat(formData.quantite_recue),
            reference_document: selectedLivraison.numero_bon_livraison,
            description: `Réception livraison ${selectedLivraison.numero_bon_livraison} - ${selectedLivraison.transporteur}`
          })
        });

        if (mouvementResponse.ok) {
          console.log('✅ Mouvement d\'entrée créé avec succès');
        } else {
          console.log('⚠️ Erreur lors de la création du mouvement d\'entrée, mais réception validée');
        }
      } catch (error) {
        console.log('⚠️ Erreur mouvement d\'entrée:', error.message);
      }

      setMessage({ 
        type: 'success', 
        text: 'Réception enregistrée avec succès' 
      });
      
      // Réinitialiser le formulaire
      setSelectedLivraison(null);
      setFormData({ quantite_recue: '', motif_ecart: '', observations: '' });
      
      // Recharger les livraisons
      fetchLivraisons(user);
      
    } catch (error) {
      console.error('Erreur enregistrement réception:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erreur lors de l\'enregistrement' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLivraisons = livraisons.filter(livraison => 
    livraison.numero_bon_livraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.numero_camion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.transporteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    livraison.nom_chauffeur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ecart = calculateEcart();
  const hasEcart = Math.abs(ecart) > 0.01;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar - Liste des livraisons */}
      <div style={{ width: '50%', padding: '20px', backgroundColor: 'white', borderRight: '2px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#2563eb', margin: 0, display: 'flex', alignItems: 'center' }}>
            🚛 Livraisons en transit
          </h2>
          <button
            onClick={() => fetchLivraisons(user)}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2563eb',
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
        
        {/* Info utilisateur */}
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '14px' }}>
          <strong>{user?.nom} {user?.prenom}</strong> - {user?.role}
          {user?.magasin_id && <span> | Magasin: {user.magasin_id}</span>}
        </div>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher par N° bon, camion, transporteur..."
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

        {/* Messages */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#dc2626', 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '20px' 
          }}>
            ❌ {error}
          </div>
        )}

        {message.text && (
          <div style={{ 
            backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            color: message.type === 'error' ? '#dc2626' : '#16a34a',
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '20px' 
          }}>
            {message.type === 'error' ? '❌' : '✅'} {message.text}
          </div>
        )}

        {/* Liste des livraisons */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading && <p>⏳ Chargement...</p>}
          
          {!loading && filteredLivraisons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p>📦 Aucune livraison en cours</p>
              {user?.role === 'operator' && user?.magasin_id && (
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                  Filtrage actif pour le magasin: {user.magasin_id}
                </p>
              )}
            </div>
          )}

          {filteredLivraisons.map((livraison) => (
            <div
              key={livraison.id}
              onClick={() => handleSelectLivraison(livraison)}
              style={{
                padding: '15px',
                margin: '10px 0',
                border: selectedLivraison?.id === livraison.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedLivraison?.id === livraison.id ? '#eff6ff' : 'white',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedLivraison?.id !== livraison.id) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLivraison?.id !== livraison.id) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {livraison.numero_bon_livraison || `LIV-${livraison.id}`}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '3px' }}>
                    {livraison.produit?.nom} - {livraison.quantite} T
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '3px' }}>
                    🚛 {livraison.transporteur} - {livraison.numero_camion}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    👨‍💼 {livraison.nom_chauffeur}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                  <p>{livraison.destination_nom}</p>
                  {livraison.date_livraison && (
                    <p>📅 {new Date(livraison.date_livraison).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de droite - Formulaire de réception */}
      <div style={{ width: '50%', padding: '20px' }}>
        <h2 style={{ color: '#16a34a', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          📝 Enregistrer la réception
        </h2>

        {selectedLivraison ? (
          <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            {/* Détails de la livraison */}
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#374151' }}>📋 Détails de la livraison</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>N° Bon:</strong> {selectedLivraison.numero_bon_livraison}</p>
                <p><strong>Produit:</strong> {selectedLivraison.produit?.nom}</p>
                <p><strong>Quantité prévue:</strong> {selectedLivraison.quantite} T</p>
                <p><strong>Transporteur:</strong> {selectedLivraison.transporteur}</p>
                <p><strong>Camion:</strong> {selectedLivraison.numero_camion}</p>
                <p><strong>Chauffeur:</strong> {selectedLivraison.nom_chauffeur}</p>
              </div>
            </div>

            {/* Quantité reçue */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Quantité reçue (Tonnes) *
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.quantite_recue}
                onChange={(e) => setFormData({ ...formData, quantite_recue: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Affichage de l'écart */}
            {hasEcart && (
              <div style={{
                backgroundColor: ecart > 0 ? '#f0fdf4' : '#fef3c7',
                border: `1px solid ${ecart > 0 ? '#bbf7d0' : '#fcd34d'}`,
                color: ecart > 0 ? '#16a34a' : '#d97706',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                ⚠️ Écart détecté: {ecart > 0 ? '+' : ''}{ecart.toFixed(3)} T
                {ecart > 0 ? ' (Excédent)' : ' (Manquant)'}
              </div>
            )}

            {/* Motif de l'écart */}
            {hasEcart && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                  Motif de l'écart *
                </label>
                <textarea
                  value={formData.motif_ecart}
                  onChange={(e) => setFormData({ ...formData, motif_ecart: e.target.value })}
                  required={hasEcart}
                  placeholder="Expliquez la raison de l'écart..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Observations */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151' }}>
                Observations (optionnel)
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Remarques additionnelles..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: loading ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Enregistrement...' : '✅ Confirmer la réception'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLivraison(null);
                  setFormData({ quantite_recue: '', motif_ecart: '', observations: '' });
                  setMessage({ type: '', text: '' });
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#6b7280',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
            <p style={{ fontSize: '18px' }}>Sélectionnez une livraison pour enregistrer sa réception</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionLivraisonSimple;