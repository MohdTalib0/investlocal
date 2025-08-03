import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './auth';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAuthenticated?: boolean;
}

interface NotificationMessage {
  type: 'new_message' | 'post_liked' | 'post_commented' | 'comment_replied';
  messageId?: string;
  postId?: string;
  commentId?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  conversationId?: string;
  receiverId: string;
}

interface CallMessage {
  type: 'incoming_call' | 'call_accepted' | 'call_rejected' | 'call_ended';
  callerId: string;
  callerName: string;
  callId: string;
  timestamp: string;
}

class NotificationService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      // WebSocket client connected

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth') {
            this.handleAuthentication(ws, message);
          }
        } catch (error) {
          // Error parsing WebSocket message handled silently
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          // Client disconnected
        }
      });

      ws.on('error', (error) => {
        // WebSocket error handled silently
      });
    });
  }

  private handleAuthentication(ws: AuthenticatedWebSocket, message: any) {
    try {
      // Verify the token
      const decoded = verifyToken(message.token);
      if (decoded && decoded.userId === message.userId) {
        ws.userId = message.userId;
        ws.isAuthenticated = true;
        this.clients.set(message.userId, ws);
        // Client authenticated
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'Successfully authenticated'
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Authentication failed'
        }));
        ws.close();
      }
    } catch (error) {
              // Authentication error handled silently
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
      ws.close();
    }
  }

  public sendNotification(receiverId: string, notification: NotificationMessage) {
    const client = this.clients.get(receiverId);
    if (client && client.isAuthenticated && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(notification));
        // Notification sent
      } catch (error) {
                  // Error sending notification handled silently
        // Remove disconnected client
        this.clients.delete(receiverId);
      }
    }
  }

  public sendCallNotification(receiverId: string, callMessage: CallMessage) {
    const client = this.clients.get(receiverId);
    if (client && client.isAuthenticated && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(callMessage));
        // Call notification sent
      } catch (error) {
                  // Error sending call notification handled silently
        // Remove disconnected client
        this.clients.delete(receiverId);
      }
    }
  }

  public broadcastToAll(message: any) {
    this.clients.forEach((client, userId) => {
      if (client.isAuthenticated && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          // Error broadcasting handled silently
          this.clients.delete(userId);
        }
      }
    });
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

export default NotificationService; 