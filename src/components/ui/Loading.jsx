import React from 'react';
import clsx from 'clsx';

const Loading = ({ 
  size = 'md', 
  color = 'blue', 
  fullScreen = false,
  text = 'Chargement...',
  showText = true,
  className 
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const colors = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  };

  const Spinner = () => (
    <div
      className={clsx(
        'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizes[size],
        colors[color]
      )}
      role="status"
      aria-label={text}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        {text}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        <div className="text-center">
          <Spinner />
          {showText && (
            <p className={clsx('mt-4 text-gray-600', textSizes[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <Spinner />
      {showText && (
        <p className={clsx('mt-2 text-gray-600', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  );
};

// Composant pour les états de chargement de listes
Loading.List = ({ rows = 5, showHeader = true }) => {
  return (
    <div className="animate-pulse">
      {showHeader && (
        <div className="mb-4 h-8 bg-gray-200 rounded w-1/3"></div>
      )}
      <div className="space-y-3">
        {[...Array(rows)].map((_, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour les états de chargement de cartes
Loading.Cards = ({ cards = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(cards)].map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

// Composant pour les états de chargement de formulaires
Loading.Form = ({ fields = 5 }) => {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(fields)].map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
};

export default Loading;