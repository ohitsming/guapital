'use client'

import React from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />,
    error: <XCircleIcon aria-hidden="true" className="size-6 text-red-400" />,
    info: <InformationCircleIcon aria-hidden="true" className="size-6 text-blue-400" />,
  };

  const titles = {
    success: 'Success!',
    error: 'Error',
    info: 'Information',
  };

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 isolate flex items-start justify-end px-4 pt-4 pb-6 sm:pt-4 sm:pr-6"
      style={{ zIndex: 999999 }}
    >
      <div className="flex w-full flex-col items-end space-y-4 max-w-sm">
        <Transition
          show={true}
          enter="transform transition duration-300 ease-out"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition duration-100 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="pointer-events-auto relative w-full max-w-sm rounded-lg bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10" style={{ zIndex: 999999 }}>
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  {icons[type]}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{titles[type]}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
};

