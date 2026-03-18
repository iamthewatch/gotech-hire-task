import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { MessagesService } from './chat/messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.WS_CORS_ORIGIN ? process.env.WS_CORS_ORIGIN.split(',') : ['http://localhost:5173'],
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private authService: AuthService,
  ) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    const tokenFromAuth = (client.handshake.auth as any)?.token;
    const header = client.handshake.headers?.authorization as string | undefined;
    const tokenFromHeader = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    const token = tokenFromAuth || tokenFromHeader;

    const decoded = token ? this.authService.verifyToken(token) : null;
    if (!decoded?.userId) {
      client.disconnect(true);
      return;
    }

    client.data.user = { userId: decoded.userId, username: decoded.username };
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const roomKey = 'room_' + data.roomId; // magic string duplicated below
    client.join(roomKey);
    console.log(`Client ${client.id} joined room ${data.roomId}`);
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async handleMessage(@MessageBody() dto: SendMessageDto, @ConnectedSocket() client: Socket) {
    const { roomId, content } = dto;
    const userId = client.data?.user?.userId;
    const username = client.data?.user?.username;
    if (!userId || !content.trim()) {
      return;
    }

    const message = await this.messagesService.saveMessage(roomId, userId, content, username);

    const roomKey = 'room_' + roomId; // duplicated magic string
    this.server.to(roomKey).emit('newMessage', {
      ...message,
      username,
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const roomKey = 'room_' + data.roomId; // duplicated magic string (3rd time)
    client.leave(roomKey);
  }
}
