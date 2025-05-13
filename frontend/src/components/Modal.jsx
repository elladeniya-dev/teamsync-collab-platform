import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white text-black rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <button
          className="absolute top-2 right-2 text-gray-600 text-xl hover:text-red-600"
          onClick={onClose}
          aria-label="Close Modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
