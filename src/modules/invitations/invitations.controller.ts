import { Controller, Post, Get, Req, Res, Body, UseGuards } from '@nestjs/common';
import { FriendInvitationDTO } from './invitations.dto';
import Invitation from '@database/entities/invitation';
import { InvitationsService, Type } from '@modules/invitations/invitations.service';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import AuthGuard from '@modules/auth/auth.guard';
import { Request, Response } from 'express';

@UseGuards(AuthGuard)
@Controller()
export class InvitationsController {

    public constructor(private readonly invitationsService: InvitationsService) {}

    @ApiTags('me')
    @Get('/me/friends/invitation')
    public async getMyInvitations(@Req() req: Request): Promise<Invitation[]> {
        const { id }: any = req.user;
        return await this.invitationsService.find({ senderId: id });
    }

    @ApiTags('me')
    @Get('/me/friends/invitation/new')
    public async getNewInvitations(@Req() req: Request): Promise<Invitation[]> {
        const { id }: any = req.user;
        return await this.invitationsService.find({ recipientId: id });
    }

    @ApiTags('me')
    @ApiBody({ type: FriendInvitationDTO })
    @Post('/me/friends/invitation')
    public async sendInvitation(
        @Req() req: Request,
        @Body() payload: FriendInvitationDTO
    ): Promise<void> {
        const { id }: any = req.user;
        await this.invitationsService.create(id, payload.userId, Type.INVITE_TO_FRIENDS);
    }

}

export default InvitationsController;