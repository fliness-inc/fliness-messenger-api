import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { User } from '@database/entities/user';

import { ApiBody, ApiProperty } from '@nestjs/swagger';

export class UserData {
  @ApiProperty({ type: String })
  public readonly name: string;

  @ApiProperty({ type: String })
  public readonly email: string;

  @ApiProperty({ type: String })
  public readonly password: string;
}

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  public constructor(private readonly friends: FriendsService) {}

  @Get()
  public async findAll(): Promise<User[]> {
    return this.friends.find();
  }

  @Post()
  @ApiBody({ type: UserData })
  public async create(@Body() body: UserData): Promise<User> {
    return this.friends.create(body);
  }
}
