'use client'

import React from 'react';
import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const baseClasses = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 flex items-center justify-between";

  const typeClasses = {
    success: "bg-neutral-700",
    error: "bg-red-700",
    info: "bg-indigo-500",
  };

  return (
    <div className={clsx(baseClasses, typeClasses[type])}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 cursor-pointer">
        <XMarkIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

