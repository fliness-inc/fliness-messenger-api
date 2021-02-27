import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { In } from 'typeorm';
import UserEntity from '~/db/entities/user.entity';
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
      where: { id: user.id },
    });

    if (!userFound) throw new NotFoundException('The user was not found');

    return userFound;
  }

  @Get('/users/:userId')
  public async getUser(@Param('userId') userId: string): Promise<UserEntity> {
    const user: UserEntity = await this.usersService.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('The user was not found');

    return user;
  }

  @Get('/users')
  public async getUsers(@Query('ids') ids: string) {
    if (ids) {
      const userIds = ids.split(',');
      return this.usersService.find({
        where: { id: Array.isArray(userIds) ? In(userIds) : userIds },
      });
    }

    return this.usersService.find();
  }
}

export default UsersController;
