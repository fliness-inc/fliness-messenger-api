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
  public async getMe(@CurrentUser() user): Promise<any> {
    const userFound = await this.usersService.findOne({
      where: { id: user.id },
    });

    if (!userFound) throw new NotFoundException('The user was not found');

    return {
      id: userFound.id,
      name: userFound.name,
      email: userFound.email,
      avatarURL: userFound.avatarURL,
      updatedAt: userFound.updatedAt,
      createdAt: userFound.createdAt,
    };
  }

  @Get('/users/:userId')
  public async getUser(@Param('userId') userId: string): Promise<any> {
    const userFound: UserEntity = await this.usersService.findOne({
      where: { id: userId },
    });

    if (!userFound) throw new NotFoundException('The user was not found');

    return {
      id: userFound.id,
      name: userFound.name,
      email: userFound.email,
      avatarURL: userFound.avatarURL,
      updatedAt: userFound.updatedAt,
      createdAt: userFound.createdAt,
    };
  }

  @Get('/users')
  public async getUsers(@Query('ids') ids: string): Promise<any> {
    if (ids) {
      const userIds = ids.split(',');
      return (
        await this.usersService.find({
          where: { id: Array.isArray(userIds) ? In(userIds) : userIds },
        })
      ).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarURL: user.avatarURL,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
      }));
    }

    return (await this.usersService.find()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarURL: user.avatarURL,
      updatedAt: user.updatedAt,
      createdAt: user.createdAt,
    }));
  }
}

export default UsersController;
