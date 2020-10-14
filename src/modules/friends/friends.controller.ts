/* import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { Friend } from '@database/entities/friend';
import { ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@modules/auth/auth.guard';
import { Request } from 'express';

@UseGuards(AuthGuard)
@Controller()
export class FriendsController {
    public constructor(private readonly friendsService: FriendsService) {}

    @ApiTags('/me/friends')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Get('/me/friends')
    public async findAll(@Req() req: Request): Promise<Friend[]> {
        const { id }: any = req.user;
        return this.friendsService.find({ where: { userId: id } });
    }
}
 */