import React from 'react';
import clsx from 'clsx';

const Card = ({
  children,
  className,
  title,
  subtitle,
  headerAction,
  footer,
  padding = true,
  shadow = 'md',
  border = true,
  hover = false,
  onClick,
  ...props
}) => {
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg',
        shadows[shadow],
        border && 'border border-gray-200',
        hover && 'transition-shadow hover:shadow-lg',
        onClick && 'cursor-pointer w-full text-left',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className={clsx(
          'flex items-start justify-between',
          padding ? 'p-6' : 'px-6 py-4',
          footer && 'border-b border-gray-200'
        )}>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4 flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={clsx(padding && !title && 'p-6', padding && title && 'px-6 pb-6')}>
        {children}
      </div>

      {footer && (
        <div className={clsx(
          'bg-gray-50 border-t border-gray-200 rounded-b-lg',
          padding ? 'px-6 py-4' : 'px-6 py-3'
        )}>
          {footer}
        </div>
      )}
    </Component>
  );
};

// Composant pour les sections de carte
Card.Section = ({ children, className, padding = true, border = false }) => {
  return (
    <div className={clsx(
      padding && 'px-6 py-4',
      border && 'border-t border-gray-200',
      className
    )}>
      {children}
    </div>
  );
};

// Composant pour les grilles de cartes
Card.Grid = ({ children, cols = 3, gap = 6, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'
  };

  const gaps = {
    0: 'gap-0',
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={clsx(
      'grid',
      gridCols[cols] || gridCols[3],
      gaps[gap] || gaps[6],
      className
    )}>
      {children}
    </div>
  );
};

// Composants supplémentaires pour la compatibilité
export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);

export { Card };
export default Card;