import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { ChatService } from './chat.service';
import { getJwtSecret } from '../core/constant';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // userId -> Set of socketIds (user can have multiple tabs/devices)
  private onlineUsers = new Map<string, Set<string>>();

  constructor(private readonly chatService: ChatService) {}

  afterInit() {
    console.log('Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = Buffer.from(getJwtSecret(), 'base64');
      const decoded = jwt.verify(token, secret) as JwtPayload;
      client.userId = decoded.id as string;

      // Track online user
      if (!this.onlineUsers.has(client.userId)) {
        this.onlineUsers.set(client.userId, new Set());
      }
      this.onlineUsers.get(client.userId)!.add(client.id);

      // Join personal room
      client.join(`user:${client.userId}`);

      // Broadcast online status
      this.server.emit('user:online', { userId: client.userId });

      console.log(`User ${client.userId} connected (socket: ${client.id})`);
    } catch (err) {
      console.error('WebSocket auth failed:', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
          // Broadcast offline status only if all tabs closed
          this.server.emit('user:offline', { userId: client.userId });
        }
      }
      console.log(`User ${client.userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { receiverId: string; content: string; type?: string },
  ) {
    if (!client.userId) return;

    const message = await this.chatService.saveMessage(
      client.userId,
      data.receiverId,
      data.content,
      data.type || 'text',
    );

    // Send to receiver's room (all their tabs/devices)
    this.server.to(`user:${data.receiverId}`).emit('message:receive', {
      id: message.id,
      senderId: client.userId,
      receiverId: data.receiverId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      isRead: false,
    });

    // Confirm to sender
    client.emit('message:sent', {
      id: message.id,
      senderId: client.userId,
      receiverId: data.receiverId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      isRead: false,
    });
  }

  @SubscribeMessage('message:read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { senderId: string },
  ) {
    if (!client.userId) return;

    await this.chatService.markAsRead(client.userId, data.senderId);

    // Notify the sender that messages were read
    this.server.to(`user:${data.senderId}`).emit('message:read', {
      readBy: client.userId,
    });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    if (!client.userId) return;
    this.server.to(`user:${data.receiverId}`).emit('typing:start', {
      userId: client.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    if (!client.userId) return;
    this.server.to(`user:${data.receiverId}`).emit('typing:stop', {
      userId: client.userId,
    });
  }

  @SubscribeMessage('online:check')
  handleOnlineCheck(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const onlineStatuses = data.userIds.map((id) => ({
      userId: id,
      isOnline: this.onlineUsers.has(id),
    }));
    client.emit('online:status', onlineStatuses);
  }

  // Notify friend request (called from FriendService via event)
  notifyFriendRequest(receiverId: string, data: any) {
    this.server.to(`user:${receiverId}`).emit('friend:request', data);
  }

  notifyFriendAccepted(requesterId: string, data: any) {
    this.server.to(`user:${requesterId}`).emit('friend:accepted', data);
  }
}
