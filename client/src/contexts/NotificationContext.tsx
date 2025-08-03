import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/use-notifications';

interface NotificationContextType {
  settings: {
    enabled: boolean;
    sound: boolean;
    browserNotifications: boolean;
    vibration: boolean;
  };
  unreadCount: number;
  notifications: Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    conversationId: string;
  }>;
  updateSettings: (newSettings: Partial<{
    enabled: boolean;
    sound: boolean;
    browserNotifications: boolean;
    vibration: boolean;
  }>) => void;
  clearNotifications: (conversationId?: string) => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationHook = useNotifications();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
} 