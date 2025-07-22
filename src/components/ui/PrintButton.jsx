import React from 'react';
import { PrinterIcon } from './SimpleIcons';
import Button from './Button';

const PrintButton = ({
  onClick,
  disabled = false,
  variant = 'outline',
  size = 'md',
  className = '',
  children = 'Imprimer'
}) => {
  const handlePrint = () => {
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={disabled}
      className={`flex items-center space-x-2 ${className}`}
    >
      <PrinterIcon className="h-4 w-4" />
      <span>{children}</span>
    </Button>
  );
};

export default PrintButton;