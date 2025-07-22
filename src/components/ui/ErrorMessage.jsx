import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from './SimpleIcons';

const ErrorMessage = ({ 
  error, 
  onClose,
  className = '',
  variant = 'default' // 'default', 'inline', 'toast'
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || 'Une erreur inattendue s\'est produite';

  const variants = {
    default: 'bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg',
    inline: 'text-red-600 text-sm mt-1',
    toast: 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md'
  };

  if (variant === 'inline') {
    return (
      <p className={`${variants.inline} ${className}`}>
        {errorMessage}
      </p>
    );
  }

  return (
    <div className={`${variants[variant]} ${className}`} role="alert">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" />
        <div className="flex-1">
          <p className={variant === 'toast' ? 'font-medium' : 'text-sm font-medium'}>
            {errorMessage}
          </p>
          {error.details && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {error.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${
              variant === 'toast' 
                ? 'text-white hover:text-gray-200' 
                : 'text-red-400 hover:text-red-600'
            } transition-colors`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;