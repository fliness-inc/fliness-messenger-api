import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '~/modules/auth/auth.guard';
import CurrentUser from '../auth/current-user';
import UsersService from './users.service';

@Controller()
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @AuthGuard()
  @Get('/me')
  public async me(@CurrentUser() user) {
    const userFound = await this.usersService.findOne({
      select: ['id', 'email', 'name', 'createdAt', 'avatarURL'],
      where: { id: user.id },
    });

    if (!userFound) throw new NotFoundException('The user was not found');

    return userFound;
  }
}

export default UsersController;
