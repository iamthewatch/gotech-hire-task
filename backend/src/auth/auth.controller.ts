import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '../auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto.username, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.username, dto.password);
    if (!result) return { error: 'Invalid credentials' };
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId;
    if (!userId) return { error: 'Unauthorized' };
    return { id: userId, username: req.user?.username };
  }
}