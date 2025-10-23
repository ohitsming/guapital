'use client';

import { useEffect, useState, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type?: NotificationType;
  onClose: () => void;
  duration?: number; // Auto-close after X milliseconds (0 = no auto-close)
}

export function Notification({ message, type = 'info', onClose, duration = 5000 }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for animation to finish before calling onClose
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);

    // Auto-close after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-red-400" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`fixed top-5 right-4 z-[9999] max-w-md w-full transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{style.icon}</div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${style.text}`}>{message}</p>
          </div>
          <button
            onClick={handleClose}
            className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Container component to manage multiple notifications
interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: NotificationType;
  }>;
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div className="fixed top-2 right-4 z-[9999] space-y-3 max-w-md w-full pointer-events-none">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => onRemove(notification.id)}
            duration={5000}
          />
        </div>
      ))}
    </div>
  );
}

// Premium notification with Headless UI Transition
interface AlreadyPremiumNotificationProps {
  show: boolean;
  onClose: () => void;
}

export function AlreadyPremiumNotification({ show, onClose }: AlreadyPremiumNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-[9999] flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition show={show}>
          <div className="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline outline-1 outline-black/5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10">
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <CheckCircleIcon aria-hidden="true" className="size-6 text-[#004D40]" />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Already a Premium Member
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    You already have an active Premium subscription. You&apos;re all set!
                  </p>
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#004D40] dark:hover:text-white dark:focus:outline-[#00695C]"
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
}
