import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  @Get('check')
  @UseGuards(JwtAuthGuard)
  checkAuth(@Request() req) {
    return {
      isAuthenticated: true,
      user: req.user
    };
  }
}