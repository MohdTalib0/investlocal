import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  browserNotifications: boolean;
  vibration: boolean;
}

interface ChatNotification {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  conversationId: string;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    browserNotifications: true,
    vibration: false,
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (settings.sound && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [settings.sound]);

  // Vibrate device
  const vibrateDevice = useCallback(() => {
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  }, [settings.vibration]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: ChatNotification) => {
    if (!settings.browserNotifications || Notification.permission !== 'granted') {
      return;
    }

    const browserNotification = new Notification('New Message', {
      body: `${notification.senderName}: ${notification.content}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.conversationId,
      requireInteraction: false,
      silent: true, // We'll play our own sound
    });

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      // Navigate to chat
      window.location.href = `/chat/${notification.senderId}`;
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }, [settings.browserNotifications]);

  // Handle new message notification
  const handleNewMessage = useCallback((notification: ChatNotification) => {
    if (!settings.enabled) return;

    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Update unread count
    setUnreadCount(prev => prev + 1);

    // Play sound
    playNotificationSound();

    // Vibrate
    vibrateDevice();

    // Show browser notification
    showBrowserNotification(notification);

    // Invalidate conversations query to update unread counts
    queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
  }, [settings.enabled, playNotificationSound, vibrateDevice, showBrowserNotification, queryClient]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    const currentUser = authService.getUser();
    if (!currentUser) return;

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws`
      : `ws://localhost:5000/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected for notifications');
      // Send authentication
      wsRef.current?.send(JSON.stringify({
        type: 'auth',
        userId: currentUser.id,
        token: authService.getToken(),
      }));
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.senderId !== currentUser.id) {
          handleNewMessage({
            id: data.messageId,
            senderId: data.senderId,
            senderName: data.senderName,
            content: data.content,
            timestamp: data.timestamp,
            conversationId: data.conversationId,
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 5 seconds
      setTimeout(() => {
        initializeWebSocket();
      }, 5000);
    };
  }, [handleNewMessage]);

  // Initialize notifications
  useEffect(() => {
    if (settings.enabled) {
      requestPermission();
      initializeWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [settings.enabled, requestPermission, initializeWebSocket]);

  // Clear notifications when user opens chat
  const clearNotifications = useCallback((conversationId?: string) => {
    if (conversationId) {
      setNotifications(prev => prev.filter(n => n.conversationId !== conversationId));
    } else {
      setNotifications([]);
    }
    setUnreadCount(0);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    unreadCount,
    notifications,
    updateSettings,
    clearNotifications,
    requestPermission,
  };
} 