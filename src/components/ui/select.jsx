import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext();

export const Select = ({ value, onValueChange, children, disabled = false }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, disabled }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className, placeholder = 'Select...' }) => {
  const { value, open, setOpen, disabled } = useContext(SelectContext);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => !disabled && setOpen(!open)}
      disabled={disabled}
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'ring-offset-white placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <span className={clsx(!value && 'text-gray-500')}>
        {value || placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

export const SelectContent = ({ children, className }) => {
  const { open } = useContext(SelectContext);
  
  if (!open) return null;

  return (
    <div
      className={clsx(
        'absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

export const SelectItem = ({ value, children, className, disabled = false }) => {
  const { value: selectedValue, onValueChange, setOpen } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleSelect = () => {
    if (!disabled) {
      onValueChange(value);
      setOpen(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={disabled}
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'focus:bg-gray-100 focus:text-gray-900',
        'hover:bg-gray-100',
        'disabled:pointer-events-none disabled:opacity-50',
        isSelected && 'bg-gray-100',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
};

export const SelectValue = ({ placeholder }) => {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

export const SelectSeparator = ({ className }) => {
  return <div className={clsx('my-1 h-px bg-gray-200', className)} />;
};

export const SelectGroup = ({ children }) => {
  return <div>{children}</div>;
};

export const SelectLabel = ({ children, className }) => {
  return (
    <div className={clsx('px-2 py-1.5 text-sm font-semibold text-gray-900', className)}>
      {children}
    </div>
  );
};

export default Select;