import React, { createContext, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

const DialogContext = createContext();

export const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({ children, asChild = false, onClick }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  const handleClick = (e) => {
    onClick?.(e);
    onOpenChange?.(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
};

export const DialogPortal = ({ children }) => {
  const { open } = useContext(DialogContext);
  
  if (!open) return null;
  
  return createPortal(children, document.body);
};

export const DialogOverlay = ({ className }) => {
  const { onOpenChange } = useContext(DialogContext);
  
  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        className
      )}
      onClick={() => onOpenChange?.(false)}
    />
  );
};

export const DialogContent = ({ children, className, showClose = true }) => {
  const { onOpenChange } = useContext(DialogContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onOpenChange]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={contentRef}
          className={clsx(
            'relative w-full max-w-lg bg-white rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {showClose && (
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
              onClick={() => onOpenChange?.(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
          {children}
        </div>
      </div>
    </DialogPortal>
  );
};

export const DialogHeader = ({ children, className }) => {
  return (
    <div className={clsx('p-6 pb-0', className)}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ children, className }) => {
  return (
    <h2 className={clsx('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({ children, className }) => {
  return (
    <p className={clsx('text-sm text-gray-500 mt-1.5', className)}>
      {children}
    </p>
  );
};

export const DialogFooter = ({ children, className }) => {
  return (
    <div className={clsx('p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
};

export default Dialog;