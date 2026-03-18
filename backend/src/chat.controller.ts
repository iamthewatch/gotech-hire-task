import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { CreateRoomDto } from './chat/dto/create-room.dto';
import { RoomsService } from './chat/rooms.service';
import { MessagesService } from './chat/messages.service';

@Controller('chat')
export class ChatController {
  constructor(
    private roomsService: RoomsService,
    private messagesService: MessagesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  async getRooms() {
    return this.roomsService.getRooms();
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  async createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto.name, dto.description);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const take = Math.min(Math.max(parseInt(limit || '50', 10) || 50, 1), 200);
    const skip = Math.max(parseInt(offset || '0', 10) || 0, 0);
    return this.messagesService.getMessages(parseInt(roomId, 10), { take, skip });
  }
}
