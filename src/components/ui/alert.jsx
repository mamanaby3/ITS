import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export const Alert = ({ children, className = '', variant = 'default', ...props }) => {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-300',
    error: 'bg-red-50 border-red-300',
    success: 'bg-green-50 border-green-300',
    warning: 'bg-yellow-50 border-yellow-300',
    info: 'bg-blue-50 border-blue-300'
  };

  return (
    <div
      className={`
        p-4 rounded-lg border
        ${variantStyles[variant] || variantStyles.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};