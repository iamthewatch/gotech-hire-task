import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from '../chat.controller';
import { ChatGateway } from '../chat.gateway';
import { Message } from '../entities/message.entity';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { RoomsService } from './rooms.service';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Room, Message]), AuthModule],
  controllers: [ChatController],
  providers: [RoomsService, MessagesService, ChatGateway],
})
export class ChatModule {}