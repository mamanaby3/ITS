import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Minus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const SaisieSorties = () => {
  const [message, setMessage] = useState(null);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    console.log('📍 SaisieSorties - Composant monté');
    console.log('👤 Utilisateur actuel:', user);
    console.log('🔑 Role utilisateur:', user?.role);
    console.log('✅ hasRole("operator"):', hasRole('operator'));
    console.log('✅ hasRole("manager"):', hasRole('manager'));
  }, [user, hasRole]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Minus className="w-6 h-6 text-red-600" />
        Saisie des Sorties
      </h1>

      {message && (
        <div className="p-4 rounded-md bg-green-50 text-green-700 border border-green-200 mb-4">
          {message}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Test de la page</h2>
        <p>Si vous voyez ce message, la page se charge correctement !</p>
        
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Informations de debug:</h3>
          <ul className="text-sm space-y-1">
            <li>Utilisateur: {user?.prenom} {user?.nom}</li>
            <li>Email: {user?.email}</li>
            <li>Rôle: {user?.role}</li>
            <li>Magasin ID: {user?.magasin_id}</li>
            <li>hasRole("operator"): {hasRole('operator') ? 'OUI' : 'NON'}</li>
            <li>hasRole("manager"): {hasRole('manager') ? 'OUI' : 'NON'}</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => setMessage('Page fonctionnelle !')}
          className="mt-4"
        >
          Tester
        </Button>
      </Card>
    </div>
  );
};

export default SaisieSorties;