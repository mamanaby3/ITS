import React from 'react';
import Loading from './Loading';

const LoadingState = ({ 
  loading = false, 
  error = null, 
  empty = false,
  data = null,
  loadingComponent = <Loading />,
  errorComponent = null,
  emptyComponent = null,
  emptyMessage = 'Aucune donnée à afficher',
  children 
}) => {
  // État de chargement
  if (loading) {
    return loadingComponent || (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loading />
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return errorComponent || (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
        <div className="text-red-500 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Une erreur s'est produite
        </h3>
        <p className="text-gray-600">
          {typeof error === 'string' ? error : error.message || 'Impossible de charger les données'}
        </p>
      </div>
    );
  }

  // État vide
  const isEmpty = empty || (
    data !== null && 
    data !== undefined && 
    ((Array.isArray(data) && data.length === 0) ||
     (typeof data === 'object' && Object.keys(data).length === 0))
  );

  if (isEmpty) {
    return emptyComponent || (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-4">
        <div className="text-gray-400 mb-2">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  // Contenu normal
  return children;
};

export default LoadingState;