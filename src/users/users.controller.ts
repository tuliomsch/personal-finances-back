import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async registerUser(
    @Body(new ValidationPipe()) createUserDto: RegisterUserDto,
  ) {
    return this.usersService.registerUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const supabaseId: string = req.user.sub;
    const user = await this.usersService.findUserBySupabaseId(supabaseId);
    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado en DB, complete su perfil',
      );
    }
    return user;
  }
}
