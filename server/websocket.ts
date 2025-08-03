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
      console.log('WebSocket client connected');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth') {
            this.handleAuthentication(ws, message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.clients.delete(ws.userId);
          console.log(`Client ${ws.userId} disconnected`);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
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
        console.log(`Client ${message.userId} authenticated`);
        
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
      console.error('Authentication error:', error);
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
        console.log(`Notification sent to ${receiverId}`);
      } catch (error) {
        console.error('Error sending notification:', error);
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
        console.log(`Call notification sent to ${receiverId}: ${callMessage.type}`);
      } catch (error) {
        console.error('Error sending call notification:', error);
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
          console.error(`Error broadcasting to ${userId}:`, error);
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