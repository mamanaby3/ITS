import React, { useState, useEffect } from 'react';

const TestPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'green' }}>✅ Page de test - SUCCÈS</h1>
      <p>Si vous voyez cette page, le routage fonctionne.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Informations utilisateur :</h3>
        {user ? (
          <pre style={{ backgroundColor: 'white', padding: '10px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        ) : (
          <p>Aucun utilisateur connecté</p>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/reception-livraisons" style={{ color: 'blue', textDecoration: 'underline' }}>
          Aller vers la réception des livraisons
        </a>
      </div>
    </div>
  );
};

export default TestPage;