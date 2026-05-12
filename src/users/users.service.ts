import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.getUser(createUserDto.email);
    if (user.userAlive) {
      return {
        success: false
      };
    }
    return {
      success: true,
      ...this.create_hash(createUserDto)
    }
  }

  async login(loginUserDto: LoginUserDto, response: any) {
    const user = await this.getUser(loginUserDto.email);
    if (!user.userAlive || !user.user) {
      return { success: false, message: "User is not alive" };
    }
    
    const isPasswordValid = await this.verifyPassword(
      loginUserDto.password, 
      user.user.password_hash
    );
    
    if (!isPasswordValid) {
      return { success: false, message: "Invalid credentials" };
    }
    
    const payload = { 
      sub: user.user.id, 
      email: user.user.email,
      name: user.user.name
    };
    
    // Keep the JWT payload minimal; route handlers can trust `req.user` after
    // the guard verifies this signed blob.
    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });
    
    // Cookie-based auth keeps the token out of client-side storage while still
    // allowing the browser to send it automatically on API calls.
    response.cookie('jwt', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return {
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.name
      }
    };
  }

  async create_hash(createUserDto: CreateUserDto) {
    // Store a slow password hash so the original password never reaches the DB.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password_hash: hashedPassword,
        salt: salt
      },
    });
  }

  async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async getUser(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email
      }
    });
    return {
      userAlive: user !== null,
      user: user
    };
  }
}
