import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
  label,
  error,
  hint,
  prefix,
  suffix,
  className,
  inputClassName,
  wrapperClassName,
  type = 'text',
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={clsx(
            'block w-full rounded-md shadow-sm transition-colors duration-200',
            'focus:ring-2 focus:ring-offset-0',
            prefix && 'pl-10',
            suffix && 'pr-10',
            hasError
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
            inputClassName || 'px-3 py-2 text-sm',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p
          className="mt-1 text-sm text-red-600"
          id={`${props.id || props.name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Composant Select utilisant le même style
const Select = forwardRef(({
  label,
  error,
  hint,
  className,
  wrapperClassName,
  options = [],
  placeholder = 'Sélectionner...',
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        disabled={disabled}
        className={clsx(
          'block w-full rounded-md shadow-sm transition-colors duration-200',
          'focus:ring-2 focus:ring-offset-0 px-3 py-2 text-sm',
          hasError
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        aria-invalid={hasError}
        aria-describedby={error ? `${props.id || props.name}-error` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p
          className="mt-1 text-sm text-red-600"
          id={`${props.id || props.name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Composant Textarea utilisant le même style
const Textarea = forwardRef(({
  label,
  error,
  hint,
  className,
  wrapperClassName,
  rows = 3,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={clsx(
          'block w-full rounded-md shadow-sm transition-colors duration-200',
          'focus:ring-2 focus:ring-offset-0 px-3 py-2 text-sm',
          hasError
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          className
        )}
        aria-invalid={hasError}
        aria-describedby={error ? `${props.id || props.name}-error` : undefined}
        {...props}
      />

      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p
          className="mt-1 text-sm text-red-600"
          id={`${props.id || props.name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export { Input, Select, Textarea };
export default Input;