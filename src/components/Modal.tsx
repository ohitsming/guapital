"use client"

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto outline-none focus:outline-none">
      {/* Backdrop with enhanced blur */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container with proper centering */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal content */}
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 rounded-t-2xl flex-shrink-0">
            <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-[#004D40] to-[#00695C] bg-clip-text text-transparent">
              {title || 'Modal Title'}
            </h3>
            <button
              className="p-2 ml-4 bg-transparent text-gray-400 hover:text-gray-600
                         rounded-xl hover:bg-gray-100 transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
              onClick={onClose}
              type="button"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="relative p-6 overflow-y-auto flex-1">
            {children}
          </div>

          {/* Footer - Fixed */}
          {footer && (
            <div className="flex-shrink-0 border-t-2 border-gray-100 bg-gray-50 rounded-b-2xl px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
