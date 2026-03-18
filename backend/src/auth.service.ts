import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  async register(username: string, password: string): Promise<any> {
    const existing = await this.userRepository.findOne({ where: { username } });
    if (existing) {
      return { error: 'Username already taken' };
    }

    const passwordHash = await this.hashPassword(password);
    const user = this.userRepository.create({ username, password: passwordHash });
    const saved = await this.userRepository.save(user);
    const token = jwt.sign({ userId: saved.id, username }, this.getJwtSecret(), { expiresIn: '24h' });
    return { token, userId: saved.id };
  }

  async login(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      return null;
    }

    const ok = await this.verifyPassword(password, user.password);
    if (!ok) {
      return null;
    }

    const token = jwt.sign({ userId: user.id, username }, this.getJwtSecret(), { expiresIn: '24h' });
    return { token, userId: user.id };
  }

  // async refreshToken(token: string) {
  //   // TODO: implement refresh tokens
  //   return null;
  // }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.getJwtSecret());
    } catch {
      return null;
    }
  }
}
