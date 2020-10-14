/* import { Controller, Post, Get, Req, Res, Body, UseGuards, Param } from '@nestjs/common';
import { FriendInvitationDTO, Type } from '@modules/invitations/invitations.dto';
import Invitation from '@database/entities/invitation';
import { InvitationsService, InvitationResponse } from '@modules/invitations/invitations.service';
import { ApiTags, ApiBody, ApiCreatedResponse, ApiBadRequestResponse, ApiOkResponse, ApiNotFoundResponse, ApiParam, ApiConflictResponse, ApiUnauthorizedResponse, ApiHeader } from '@nestjs/swagger';
import AuthGuard from '@modules/auth/auth.guard';
import { Request, Response } from 'express';

@UseGuards(AuthGuard)
@Controller()
export class InvitationsController {

    public constructor(private readonly invitationsService: InvitationsService) {}

    @ApiTags('/me/friends/invitations')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Get('/me/friends/invitations')
    public async getMyInvitations(@Req() req: Request): Promise<InvitationResponse[]> {
        const { id }: any = req.user;
        return this.invitationsService.prepareEntities(
            await this.invitationsService.find({ senderId: id })
        );
    }

    @ApiTags('/me/friends/invitations')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Get('/me/friends/invitations/new')
    public async getNewInvitationsFroMe(@Req() req: Request): Promise<InvitationResponse[]> {
        const { id }: any = req.user;
        return this.invitationsService.prepareEntities(
            await this.invitationsService.find({ recipientId: id })
        );
    }

    @ApiTags('/me/friends/invitations')
    @ApiBody({ type: FriendInvitationDTO })
    @ApiCreatedResponse({ description: 'The invitation was successfully created.' })
    @ApiBadRequestResponse({ description: 'The property of the request was invalid.' })
    @ApiConflictResponse({ description: 'The operation cannot be performed for some reason.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
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

    @ApiTags('/me/friends/invitations')
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiNotFoundResponse({ description: 'The invitation was not found.' })
    @ApiParam({ name: 'id', description: 'The unique ID of the invitation.' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Post('/me/friends/invitations/:id/accept')
    public async acceptInvitation(@Param('id') id: string): Promise<InvitationResponse> {
        return this.invitationsService.prepareEntity(
            await this.invitationsService.accept(id)
        );
    }

    @ApiTags('/me/friends/invitations')
    @ApiBody({ type: FriendInvitationDTO })
    @ApiOkResponse({ description: 'The operation was successfully performed.' })
    @ApiNotFoundResponse({ description: 'The invitation was not found.' })
    @ApiParam({ name: 'id', description: 'The unique ID of the invitation' })
    @ApiUnauthorizedResponse({ description: 'The user is unauthorized.' })
    @ApiHeader({ name: 'Authorization', description: 'The header tag contains the access token.' })
    @Post('/me/friends/invitations/:id/reject')
    public async rejectInvitation(@Param('id') id: string): Promise<InvitationResponse> {
        return this.invitationsService.prepareEntity(
            await this.invitationsService.reject(id)
        );
    }
}

export default InvitationsController; */