'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />,
        error: <XCircleIcon aria-hidden="true" className="size-6 text-red-400" />,
        info: <InformationCircleIcon aria-hidden="true" className="size-6 text-[#004D40]" />,
        warning: <InformationCircleIcon aria-hidden="true" className="size-6 text-amber-400" />,
    };

    const titles = {
        success: 'Success!',
        error: 'Error',
        info: 'Information',
        warning: 'Warning',
    };

    return (
        <div
            aria-live="assertive"
            className="pointer-events-none fixed inset-0 z-[9999] flex items-start justify-end px-4 pt-6 pb-6 sm:px-6 sm:pt-8"
        >
            <div className="flex w-full flex-col items-end space-y-4 max-w-md">
                <Transition show={true}>
                    <div className="pointer-events-auto w-full max-w-md rounded-xl bg-white shadow-xl ring-1 ring-black/5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0 dark:bg-gray-800 dark:ring-white/10">
                        <div className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    {icons[type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {titles[type]}
                                    </p>
                                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                        {message}
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex rounded-md text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:ring-offset-2 dark:hover:text-gray-300 dark:focus:ring-[#00695C]"
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

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning'; id: number } | null>(null);
    const [toastQueue, setToastQueue] = useState<{
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        id: number;
    }[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = Date.now();
        setToastQueue((prevQueue) => [...prevQueue, { message, type, id }]);
    }, []);

    useEffect(() => {
        if (toastQueue.length > 0 && !toast) {
            const [nextToast, ...rest] = toastQueue;
            setToast(nextToast);
            setToastQueue(rest);
        }
    }, [toastQueue, toast]);

    // Toast now only closes manually (removed auto-dismiss)

    const closeToast = () => {
        setToast(null);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={closeToast} />}
        </ToastContext.Provider>
    );
};
