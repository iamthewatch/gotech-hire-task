import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getMessages(roomId: number, opts: { take: number; skip: number }): Promise<any[]> {
    const messages = await this.messageRepository.find({
      where: { room_id: roomId },
      order: { createdAt: 'ASC' },
      take: opts.take,
      skip: opts.skip,
    });

    const userIds = Array.from(new Set(messages.map((m) => m.user_id).filter((id) => typeof id === 'number')));
    const users = userIds.length
      ? await this.userRepository.find({
          where: { id: In(userIds) },
          select: ['id', 'username'],
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u.username]));

    return messages.map((msg) => ({
      ...msg,
      username: byId.get(msg.user_id) ?? 'unknown',
    }));
  }

  async saveMessage(roomId: number, userId: number, content: string, senderName: string): Promise<Message> {
    const message = this.messageRepository.create({
      room_id: roomId,
      user_id: userId,
      content,
      senderName,
    });
    return this.messageRepository.save(message);
  }
}