import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '~/modules/auth/auth.guard';
import CurrentUser from '../auth/current-user';
import UsersService from './users.service';

@Controller()
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @AuthGuard()
  @Get('/me')
  public async getMe(@CurrentUser() user) {
    const userFound = await this.usersService.findOne({
      select: ['id', 'email', 'name', 'createdAt', 'avatarURL'],
      where: { id: user.id },
    });

    if (!userFound) throw new NotFoundException('The user was not found');

    return userFound;
  }

  @Get('/users')
  public async getUsers() {
    return this.usersService.find({
      select: ['id', 'email', 'name', 'createdAt', 'avatarURL'],
    });
  }
}

export default UsersController;
