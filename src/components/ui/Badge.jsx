import React from 'react';
import clsx from 'clsx';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className,
  dot = false,
  removable = false,
  onRemove,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span 
          className={clsx(
            'rounded-full mr-1.5',
            dotSizes[size],
            variant === 'default' && 'bg-gray-400',
            variant === 'primary' && 'bg-blue-400',
            variant === 'secondary' && 'bg-gray-400',
            variant === 'success' && 'bg-green-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'warning' && 'bg-yellow-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'purple' && 'bg-purple-400',
            variant === 'pink' && 'bg-pink-400',
            variant === 'indigo' && 'bg-indigo-400'
          )}
        />
      )}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={clsx(
            'ml-1 -mr-1 inline-flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2',
            size === 'xs' && 'w-3 h-3',
            size === 'sm' && 'w-3.5 h-3.5',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
            variant === 'default' && 'focus:ring-gray-500',
            variant === 'primary' && 'focus:ring-blue-500',
            variant === 'secondary' && 'focus:ring-gray-500',
            variant === 'success' && 'focus:ring-green-500',
            variant === 'danger' && 'focus:ring-red-500',
            variant === 'warning' && 'focus:ring-yellow-500',
            variant === 'info' && 'focus:ring-blue-500',
            variant === 'purple' && 'focus:ring-purple-500',
            variant === 'pink' && 'focus:ring-pink-500',
            variant === 'indigo' && 'focus:ring-indigo-500'
          )}
        >
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
};

// Composant pour un groupe de badges
Badge.Group = ({ children, className }) => {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
};

export { Badge };
export default Badge;