'use client';

import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/ui/Notification';

interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
  };
}
