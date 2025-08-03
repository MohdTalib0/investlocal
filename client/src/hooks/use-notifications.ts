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
  id?: string;
  messageId?: string;
  postId?: string;
  commentId?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  conversationId?: string;
  type?: 'new_message' | 'post_liked' | 'post_commented' | 'comment_replied';
}

interface CallNotification {
  type: 'incoming_call' | 'call_accepted' | 'call_rejected' | 'call_ended';
  callerId: string;
  callerName: string;
  callId: string;
  timestamp: string;
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
  const [incomingCall, setIncomingCall] = useState<CallNotification | null>(null);
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

    let title = 'New Message';
    let body = `${notification.senderName}: ${notification.content}`;
    let tag = notification.conversationId || notification.postId || 'notification';
    let onClickUrl = `/chat/${notification.senderId}`;

    if (notification.type === 'post_liked') {
      title = 'Post Liked';
      onClickUrl = `/post/${notification.postId}`;
    } else if (notification.type === 'post_commented') {
      title = 'New Comment';
      onClickUrl = `/post/${notification.postId}`;
    }

    const browserNotification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag,
      requireInteraction: false,
      silent: true, // We'll play our own sound
    });

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      // Navigate to appropriate page
      window.location.href = onClickUrl;
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

    // Don't try to connect if we're not in a browser environment
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws`
      : `ws://localhost:5000/ws`;

    try {
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
              type: 'new_message',
            });
          } else if (data.type === 'post_liked' && data.senderId !== currentUser.id) {
            handleNewMessage({
              id: data.postId,
              postId: data.postId,
              senderId: data.senderId,
              senderName: data.senderName,
              content: data.content,
              timestamp: data.timestamp,
              type: 'post_liked',
            });
          } else if (data.type === 'post_commented' && data.senderId !== currentUser.id) {
            handleNewMessage({
              id: data.commentId || data.postId,
              postId: data.postId,
              commentId: data.commentId,
              senderId: data.senderId,
              senderName: data.senderName,
              content: data.content,
              timestamp: data.timestamp,
              type: 'post_commented',
            });
          } else if (data.type === 'incoming_call') {
            setIncomingCall(data);
            // Play ringtone for incoming call
            if (settings.sound) {
              playNotificationSound();
            }
          } else if (data.type === 'call_accepted') {
            setIncomingCall(null);
            // Handle call accepted
          } else if (data.type === 'call_rejected') {
            setIncomingCall(null);
            // Handle call rejected
          } else if (data.type === 'call_ended') {
            setIncomingCall(null);
            // Handle call ended
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.warn('WebSocket connection failed - server may not be running');
        // Don't log the full error object to avoid console spam
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected');
        // Only reconnect if it wasn't a clean close and we're still enabled
        if (event.code !== 1000 && settings.enabled) {
          setTimeout(() => {
            initializeWebSocket();
          }, 5000);
        }
      };
    } catch (error) {
      console.warn('Failed to create WebSocket connection:', error);
    }
  }, [handleNewMessage, settings.enabled]);

  // Initialize notifications
  useEffect(() => {
    if (settings.enabled) {
      requestPermission();
      initializeWebSocket();
    } else {
      // Close WebSocket if notifications are disabled
      if (wsRef.current) {
        wsRef.current.close();
      }
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
    incomingCall,
    updateSettings,
    clearNotifications,
    requestPermission,
  };
} 