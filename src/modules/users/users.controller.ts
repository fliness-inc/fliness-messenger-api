import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/auth.guard';
import UsersService from './users.service';
import { DataFormat } from '@tools/data.interceptor';

@Controller()
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @DataFormat()
  @Get('/me')
  public async me(@Req() req) {
    const user = await this.usersService.findOne({
      select: ['id', 'email', 'name', 'createdAt', 'avatarURL'],
      where: { id: req.user.id },
    });

    if (!user) throw new NotFoundException('The user was not found');

    return user;
  }
}

export default UsersController;
