"use client"

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none backdrop-filter backdrop-blur-sm">
      <div className="relative w-auto max-w-lg mx-auto my-6">
        {/* Modal content */}
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid border-neutral-200 rounded-t">
            <h3 className="text-2xl font-semibold">
              {title || 'Modal Title'}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-neutral-900 float-right text-3xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6 text-neutral-500" />
            </button>
          </div>
          {/* Body */}
          <div className="relative p-6 flex-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
