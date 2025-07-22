import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../ui/Loading';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { user, isLoading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  console.log('🔒 ProtectedRoute - Vérification');
  console.log('   isLoading:', isLoading);
  console.log('   isAuthenticated:', isAuthenticated);
  console.log('   user:', user?.email);

  // Afficher le loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifi�
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // V�rifier le r�le requis
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">=�</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acc�s refus�</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas le r�le requis pour acc�der � cette page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            R�le requis: <span className="font-medium">{requiredRole}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // V�rifier la permission requise
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">=</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission insuffisante</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas la permission n�cessaire pour effectuer cette action.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Permission requise: <span className="font-medium">{requiredPermission}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Si toutes les v�rifications passent, afficher le contenu
  return children;
};

export { ProtectedRoute as RequireAuth };
export default ProtectedRoute;