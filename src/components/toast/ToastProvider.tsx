'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Toast } from './Toast';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
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

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);
    const [toastQueue, setToastQueue] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
        id: number;
    }[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
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

    useEffect(() => {
        if (toast) {
            const words = toast.message.split(' ').length;
            const timeout = Math.max(3000, words * 100); // 100ms per word, 3s minimum

            const timer = setTimeout(() => {
                setToast(null);
            }, timeout);

            return () => clearTimeout(timer);
        }
    }, [toast]);

    const closeToast = () => {
        setToast(null);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </ToastContext.Provider>
    );
};
