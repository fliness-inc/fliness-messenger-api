import { Controller, Post, Get, Req, Res, Body, UseGuards, Param } from '@nestjs/common';
import { FriendInvitationDTO, Type } from '@modules/invitations/invitations.dto';
import Invitation from '@database/entities/invitation';
import { InvitationsService, InvitationResponse } from '@modules/invitations/invitations.service';
import { ApiTags, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import AuthGuard from '@modules/auth/auth.guard';
import { Request, Response } from 'express';

@UseGuards(AuthGuard)
@Controller()
export class InvitationsController {

    public constructor(private readonly invitationsService: InvitationsService) {}

    @ApiTags('me')
    @ApiOkResponse()
    @Get('/me/friends/invitations')
    public async getMyInvitations(@Req() req: Request): Promise<InvitationResponse[]> {
        const { id }: any = req.user;
        return this.invitationsService.prepareEntities(
            await this.invitationsService.find({ senderId: id })
        );
    }

    @ApiTags('me')
    @ApiOkResponse()
    @Get('/me/friends/invitations/new')
    public async getNewInvitationsFroMe(@Req() req: Request): Promise<InvitationResponse[]> {
        const { id }: any = req.user;
        return this.invitationsService.prepareEntities(
            await this.invitationsService.find({ recipientId: id })
        );
    }

    @ApiTags('me')
    @ApiBody({ type: FriendInvitationDTO })
    @ApiCreatedResponse()
    @ApiBadRequestResponse()
    @Post('/me/friends/invitations')
    public async sendInvitation(
        @Req() req: Request,
        @Body() payload: FriendInvitationDTO
    ): Promise<InvitationResponse> {
        const { id }: any = req.user;
        return this.invitationsService.prepareEntity(
            await this.invitationsService.create(id, payload.userId, Type.INVITE_TO_FRIENDS)
        );
    }

    @ApiTags('me')
    @ApiOkResponse()
    @ApiNotFoundResponse()
    @ApiParam({ name: 'id', description: 'The unique ID of the invitation' })
    @Get('/me/friends/invitations/:id/accept')
    public async acceptInvitation(@Param('id') id: string): Promise<InvitationResponse> {
        return this.invitationsService.prepareEntity(
            await this.invitationsService.accept(id)
        );
    }

    @ApiTags('me')
    @ApiBody({ type: FriendInvitationDTO })
    @ApiOkResponse()
    @ApiNotFoundResponse()
    @ApiParam({ name: 'id', description: 'The unique ID of the invitation' })
    @Get('/me/friends/invitations/:id/reject')
    public async rejectInvitation(@Param('id') id: string): Promise<InvitationResponse> {
        return this.invitationsService.prepareEntity(
            await this.invitationsService.reject(id)
        );
    }
}

export default InvitationsController;