import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'chatdb',
      entities: [User, Room, Message],
      synchronize: process.env.TYPEORM_SYNC === 'true',
    }),
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}