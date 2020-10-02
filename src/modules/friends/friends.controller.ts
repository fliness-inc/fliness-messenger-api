import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { Friend } from '@database/entities/friend';
import { ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { Request } from 'express';

@UseGuards(AuthGuard)
@Controller()
export class FriendsController {
    public constructor(private readonly friendsService: FriendsService) {}

    @ApiTags('me')
    @Get('/me/friends')
    public async findAll(@Req() req: Request): Promise<Friend[]> {
        const { id }: any = req.user;
        return this.friendsService.find({ where: { userId: id } });
    }
}
