import React from 'react';

interface LoadingOverlayProps {
    show: boolean;
    message?: string;
}

export default function LoadingOverlay({ show, message = "Loading..." }: LoadingOverlayProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-neutral-900"></div>
                <p className="mt-4 text-lg text-neutral-900">{message}</p>
            </div>
        </div>
    );
}
